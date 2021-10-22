#!/usr/bin/env python3
# -*- coding: iso-8859-15 -*-

import os, pbpm, sys, json, random
from flask import Flask, render_template, send_from_directory, request

# Establish the pbpm instance that this service will work with...

default_pbpm_config_path = "/pbpm/cfg/scenario1"
pbpm_config_path = None
if os.environ.get("PBPM_CONFIG") is not None:
  pbpm_config_path = os.environ.get("PBPM_CONFIG")
elif os.path.exists(default_pbpm_config_path):
  pbpm_config_path = default_pbpm_config_path
p = pbpm.pbpm(pbpm_config_path)

# ...and on with the Flask phase...

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

# ### The user interface...

@app.route('/favicon.ico')
def favicon():
  return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/ui/')
@app.route('/ui/<page>')
def ui(page = None):
  ret = ""
  page = "index.html" if page == None else page
  if page in [ "index.css" ]:
    ret = send_from_directory(os.path.join(app.root_path, 'static'), 'index.css', mimetype='text/css')
  else:
    ret = render_template(page)
  return ret

# ### Methods for loading and saving the landscape...

@app.route('/landscape/get/')
def getLandscape():
  return json.dumps(p.landscape)

@app.route('/landscape/put/', methods = [ 'POST' ])
def putLandscape():
  p.landscape = json.loads(request.get_data().decode("utf-8"))
  p.save()
  return json.dumps(p.landscape)

# ### Endpoints for testing...

@app.route('/test/general/')
def testGeneral():
  ret = dict()
  ret["a"] = int(request.args.get("x")) * 5
  ret["b"] = int(request.args.get("y")) * 100
  return json.dumps(ret)

@app.route('/test/random/')
def testRandom():
  ret = dict()
  random.seed()
  ret["r"] = random.randrange(1, 4)
  return ret
