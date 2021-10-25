#!/usr/bin/env python3
# -*- coding: iso-8859-15 -*-

import os, pbpm, sys, json, random, html, tempfile, graphviz
from flask import Flask, render_template, send_file, request, current_app

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

@app.route('/get/status')
@app.route('/get/status/<instance_id>')
def get_status(instance_id = 5):
  s = p.get()
  return '/get/status({0}) {1}'.format(instance_id, s)

# ### The user interface...

@app.route('/favicon.ico')
def favicon():
  return current_app.send_static_file("favicon.ico")

@app.route('/js/<page>')
@app.route('/css/<page>')
@app.route('/cfg/<page>')
def cssFile(page):
  return current_app.send_static_file(page)

@app.route('/ui/')
@app.route('/ui/<page>')
def ui(page = None):
  page = "index.html" if page == None else page
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
  for k, v in request.args.items():
    ret[k] = v
  if "intVar" in ret.keys():
    intVal = int(ret["intVar"])
    ret["newVar"] = intVal * 7
  return ret

@app.route('/test/random/')
def testRandom():
  ret = dict()
  random.seed()
  ret["r"] = random.randrange(1, 4)
  return ret

@app.route('/instance/<id>')
def instanceGet(id):
  return p.loadInstance(id)

@app.route('/instance/create/', methods = [ 'POST' ])
def instanceCreate():
  map_code     = request.form['map_code']
  owner_code   = request.form['owner_code']
  vars = json.loads(request.form['vars'])
  ret = dict()
  ret["id"] = p.createInstance(map_code, owner_code, vars)
  return ret

@app.route('/instance/progress/<id>')
def instanceProgress(id):
  log = p.progressInstance(id)
  return json.dumps(log)

@app.route('/instance/progress/<id>/<action_code>/<owner_code>')
def instanceProgressAction(id, action_code, owner_code):
  log = p.progressInstance(id, action_code = action_code, owner_code = owner_code)
  return json.dumps(log)

@app.route('/instances/active/')
def instancesActive():
  ret = p.activeInstances()
  return json.dumps(ret)

@app.route('/graph/<map_code>.svg')
def graph(map_code):
  dot = graphviz.Digraph(comment="The Round Table", format="svg", engine="dot")
  config = p.landscape["map"][map_code]["config"]
  for i in range(len(config)):
    item = config[i]
    if item["type"] == "service":
      shape = "hexagon"
    elif item["type"] == "router":
      shape = "diamond"
    else:
      shape = "box"
    dot.node(str(i), "{0}:{1}".format(item["type"], item["code"]), shape=shape)
    if item["type"] in [ "station", "router" ] and "actions" in item.keys():
      for j in range(len(item["actions"])):
        dot.node("{0}.{1}".format(i, j), item["actions"][j]["code"], shape="cds")
        dot.edge(str(i), "{0}.{1}".format(i, j), constraint="true")
        if "leads_to" in item["actions"][j].keys():
          dot.edge("{0}.{1}".format(i, j), str(item["actions"][j]["leads_to"]), constraint="true")
    elif "leads_to" in item.keys():
      dot.edge(str(i), str(item["leads_to"]), constraint="true")
  #dot.edges(['AB', 'AL'])
  fout = tempfile.NamedTemporaryFile(delete=False)
  tmp = fout.name
  fout.write(dot.pipe())
  fout.close()
  ret = send_file(tmp, as_attachment=True, attachment_filename="{0}.svg".format(map_code))
  os.remove(tmp)
  return ret
