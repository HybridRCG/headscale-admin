import os
import signal
import docker
import yaml
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import copy

app = FastAPI(title="Headscale Config API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.environ.get("CONFIG_API_KEY", "changeme")
CONFIG_PATH = os.environ.get("CONFIG_PATH", "/headscale/config.yaml")
HEADSCALE_CONTAINER = os.environ.get("HEADSCALE_CONTAINER", "headscale")

security = HTTPBearer()

def verify_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials.credentials != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return credentials.credentials

def read_config():
    with open(CONFIG_PATH, "r") as f:
        return yaml.safe_load(f)

def write_config(config: dict):
    with open(CONFIG_PATH, "w") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def reload_headscale():
    try:
        client = docker.from_env()
        container = client.containers.get(HEADSCALE_CONTAINER)
        container.kill(signal.SIGHUP)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reload headscale: {str(e)}")

# --- Models ---
class NameserverPayload(BaseModel):
    ns: str
    split_name: str  # "global" or domain like "local.groblers.co.uk"

class DomainPayload(BaseModel):
    domain: str

class DNSRecordPayload(BaseModel):
    name: str
    type: str  # "A" or "AAAA"
    value: str

class RenameTailnetPayload(BaseModel):
    new_name: str

class MagicDNSPayload(BaseModel):
    enabled: bool

class OverrideDNSPayload(BaseModel):
    override: bool

# --- Endpoints ---
@app.get("/dns", dependencies=[Depends(verify_key)])
def get_dns():
    config = read_config()
    return config.get("dns", {})

@app.post("/dns/rename", dependencies=[Depends(verify_key)])
def rename_tailnet(payload: RenameTailnetPayload):
    config = read_config()
    config["dns"]["base_domain"] = payload.new_name
    write_config(config)
    reload_headscale()
    return {"message": "Tailnet renamed successfully"}

@app.post("/dns/magic", dependencies=[Depends(verify_key)])
def toggle_magic_dns(payload: MagicDNSPayload):
    config = read_config()
    config["dns"]["magic_dns"] = payload.enabled
    write_config(config)
    reload_headscale()
    return {"message": "Magic DNS updated successfully"}

@app.post("/dns/override", dependencies=[Depends(verify_key)])
def toggle_override_dns(payload: OverrideDNSPayload):
    config = read_config()
    config["dns"]["override_local_dns"] = payload.override
    write_config(config)
    reload_headscale()
    return {"message": "Override DNS updated successfully"}

@app.post("/dns/nameservers/add", dependencies=[Depends(verify_key)])
def add_nameserver(payload: NameserverPayload):
    config = read_config()
    if payload.split_name == "global":
        servers = config["dns"]["nameservers"].get("global", [])
        if payload.ns not in servers:
            servers.append(payload.ns)
        config["dns"]["nameservers"]["global"] = servers
    else:
        splits = config["dns"]["nameservers"].get("split", {})
        servers = splits.get(payload.split_name, [])
        if payload.ns not in servers:
            servers.append(payload.ns)
        splits[payload.split_name] = servers
        config["dns"]["nameservers"]["split"] = splits
    write_config(config)
    reload_headscale()
    return {"message": "Nameserver added successfully"}

@app.post("/dns/nameservers/remove", dependencies=[Depends(verify_key)])
def remove_nameserver(payload: NameserverPayload):
    config = read_config()
    if payload.split_name == "global":
        servers = config["dns"]["nameservers"].get("global", [])
        servers = [s for s in servers if s != payload.ns]
        config["dns"]["nameservers"]["global"] = servers
    else:
        splits = config["dns"]["nameservers"].get("split", {})
        servers = splits.get(payload.split_name, [])
        servers = [s for s in servers if s != payload.ns]
        if servers:
            splits[payload.split_name] = servers
        else:
            del splits[payload.split_name]
        config["dns"]["nameservers"]["split"] = splits
    write_config(config)
    reload_headscale()
    return {"message": "Nameserver removed successfully"}

@app.post("/dns/nameservers/split/add", dependencies=[Depends(verify_key)])
def add_split_domain(payload: NameserverPayload):
    """Add a new split DNS domain with initial nameserver"""
    config = read_config()
    splits = config["dns"]["nameservers"].get("split", {})
    if payload.split_name not in splits:
        splits[payload.split_name] = [payload.ns]
    else:
        if payload.ns not in splits[payload.split_name]:
            splits[payload.split_name].append(payload.ns)
    config["dns"]["nameservers"]["split"] = splits
    write_config(config)
    reload_headscale()
    return {"message": "Split DNS domain added successfully"}

@app.delete("/dns/nameservers/split/{domain}", dependencies=[Depends(verify_key)])
def remove_split_domain(domain: str):
    """Remove an entire split DNS domain"""
    config = read_config()
    splits = config["dns"]["nameservers"].get("split", {})
    if domain in splits:
        del splits[domain]
    config["dns"]["nameservers"]["split"] = splits
    write_config(config)
    reload_headscale()
    return {"message": "Split DNS domain removed successfully"}

@app.post("/dns/search_domains/add", dependencies=[Depends(verify_key)])
def add_search_domain(payload: DomainPayload):
    config = read_config()
    domains = config["dns"].get("search_domains", [])
    if payload.domain not in domains:
        domains.append(payload.domain)
    config["dns"]["search_domains"] = domains
    write_config(config)
    reload_headscale()
    return {"message": "Search domain added successfully"}

@app.post("/dns/search_domains/remove", dependencies=[Depends(verify_key)])
def remove_search_domain(payload: DomainPayload):
    config = read_config()
    domains = config["dns"].get("search_domains", [])
    domains = [d for d in domains if d != payload.domain]
    config["dns"]["search_domains"] = domains
    write_config(config)
    reload_headscale()
    return {"message": "Search domain removed successfully"}

@app.post("/dns/records/add", dependencies=[Depends(verify_key)])
def add_dns_record(payload: DNSRecordPayload):
    config = read_config()
    records = config["dns"].get("extra_records", [])
    records.append({"name": payload.name, "type": payload.type, "value": payload.value})
    config["dns"]["extra_records"] = records
    write_config(config)
    reload_headscale()
    return {"message": "DNS record added successfully"}

@app.post("/dns/records/remove", dependencies=[Depends(verify_key)])
def remove_dns_record(payload: DNSRecordPayload):
    config = read_config()
    records = config["dns"].get("extra_records", [])
    records = [r for r in records if not (r["name"] == payload.name and r["type"] == payload.type)]
    config["dns"]["extra_records"] = records
    write_config(config)
    reload_headscale()
    return {"message": "DNS record removed successfully"}

@app.get("/health")
def health():
    return {"status": "ok"}
