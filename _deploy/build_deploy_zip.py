#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bundle _deploy/companies/ into a single zip for server-side extraction."""
import os, zipfile, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "companies")
OUT = os.path.join(HERE, "companies.zip")

n, total = 0, 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
    for root, _, files in os.walk(SRC):
        for f in files:
            full = os.path.join(root, f)
            arc = os.path.relpath(full, HERE).replace(os.sep, "/")
            zf.write(full, arc)
            n += 1
            total += os.path.getsize(full)

zip_size = os.path.getsize(OUT)
with open(OUT, "rb") as fh:
    sha = hashlib.sha256(fh.read()).hexdigest()[:16]
print(f"Zipped {n} files")
print(f"Source total: {total/1024:.1f} KB")
print(f"Zip size:     {zip_size/1024:.1f} KB ({zip_size/total*100:.1f}%)")
print(f"SHA256[:16]:  {sha}")
print(f"Output:       {OUT}")
