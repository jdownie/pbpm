# -*- coding: iso-8859-15 -*-

"""
Python Business Process Modelling Class Definitions
"""

from datetime import datetime
import os, json, enum, sys, uuid, requests

class pbpmFileEnum(enum.Enum):
  landscape     = 1
  log           = 2
  active        = 3
  complete      = 4

class pbpm:

  """
  The main class through which a process modelling instance is coordinated.
  """

  path = None
  landscape = dict()

  def __init__(self, path = None):
    """
    Initialise a pbpm instance.
    :param path: The folder in which this pbpm should read and write it's process modelling work.
    """
    assert path != None,             "The pbpm class must be initialised referencing a folder in which it can maintain it's state."
    assert os.path.exists(path),     "The pbpm_config_path specified ({0}) does not exist.".format(path)
    assert os.access(path, os.W_OK), "The pbpm_config_path specified ({0}) is not writable.".format(path)
    self.path = path
    for d in [ pbpmFileEnum.active, pbpmFileEnum.complete ]:
      dir_path = self.__path(d)
      if not os.path.exists(dir_path):
        os.mkdir(dir_path)
    self.load()

  def __path(self, file_code = None, instance_id = None):
    ret = self.path
    ret = os.path.join(self.path, "landscape.json")                                    if file_code == pbpmFileEnum.landscape else ret
    ret = os.path.join(self.path, "active")                                            if file_code == pbpmFileEnum.active    else ret
    ret = os.path.join(self.path, "complete")                                          if file_code == pbpmFileEnum.complete  else ret
    ret = os.path.join(self.path, "{0}.log".format(datetime.now().strftime("%Y%m%d"))) if file_code == pbpmFileEnum.log       else ret
    return ret

  def __mend(self):
    # Make sure that the landscaps contains the essential root dictionaries.
    ds = [ "map", "station", "service", "owner", "router" ]
    for d in ds:
      if not d in self.landscape.keys():
        self.landscape[d] = dict()
    # Clean up maps...
    for map_code in self.landscape["map"]:
      if not "config" in self.landscape["map"][map_code].keys():
        self.landscape["map"][map_code]["config"] = list()
      required_stations = { "BEGIN": True, "END": True }
      for i in range(len(self.landscape["map"][map_code]["config"])):
        node = self.landscape["map"][map_code]["config"][i]
        if node["type"] == "station" and node["code"] in required_stations.keys():
          required_stations[node["code"]] = False
      for station_code in required_stations.keys():
        if required_stations[station_code]:
          node = { "type": "station", "code": station_code }
          print(station_code, file=sys.stderr)
          print(json.dumps(self.landscape["map"][map_code]), file=sys.stderr)
          self.landscape["map"][map_code]["config"].append(node)
    # Clean up stations...
    for station_code in self.landscape["station"].keys():
      if not "actions" in self.landscape["station"][station_code].keys():
        self.landscape["station"][station_code]["actions"] = list()
    # Clean up routers...
    for router_code in self.landscape["router"].keys():
      if not "actions" in self.landscape["router"][router_code].keys():
        self.landscape["router"][router_code]["actions"] = list()

  def __log(self, entry):
    dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    line = "{0} - {1}\n".format(dt, entry)
    fout = open(self.__path(pbpmFileEnum.log), "a")
    fout.write(line)
    fout.close()
    row = dict()
    row["datetime"] = dt
    row["entry"] = entry
    return row

  def load(self):
    """
    Load configuration from the path specified at initialisation.
    :return: Self
    """
    landscape_path = self.__path(pbpmFileEnum.landscape)
    self.__log("Loading landscape from {0}".format(landscape_path))
    if os.path.exists(landscape_path):
      fin = open(landscape_path, "r")
      self.landscape = json.load(fin)
      fin.close()
    else:
      self.landscape = dict()
    print("Loaded configuration from {0}".format(self.path))
    self.__mend()
    return self

  def save(self):
    """
    Save the configuration.
    :return: None
    """
    self.__mend()
    landscape_path = self.__path(pbpmFileEnum.landscape)
    self.__log("Saving landscape to {0}".format(landscape_path))
    fout = open(landscape_path, "w")
    json.dump(self.landscape, fout, indent = 2)
    fout.close()
    print("Saved configuration to {0}".format(self.path))
    return None

  def loadInstance(self, id):
    instance = dict()
    path = os.path.join(self.__path(pbpmFileEnum.active), "{0}.json".format(id))
    if not os.path.exists(path):
      path = os.path.join(self.__path(pbpmFileEnum.complete), "{0}.json".format(id))
    if os.path.exists(path):
      fin = open(path, "r")
      instance = json.load(fin)
      fin.close()
    return instance

  def saveInstance(self, id, content):
    dest = os.path.join(self.__path(pbpmFileEnum.active), "{0}.json".format(id))
    fout = open(dest, "w")
    json.dump(content, fout)
    fout.close()

  def instanceTimelineAdd(self, instance, node_type, node_code, event_code, owner_code):
    record = dict()
    record["node_type"] = node_type
    record["node_code"] = node_code
    record["event_code"] = event_code
    record["owner_code"] = owner_code
    record["datetime"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    instance["timeline"].append(record)

  def createInstance(self, map_code, owner_code, vars):
    id = uuid.uuid4()
    instance = dict()
    instance["map_code"] = map_code
    instance["owner_code"] = owner_code
    instance["vars"] = vars
    instance["timeline"] = list()
    instance["log"] = list()
    instance["station_code"] = "BEGIN"
    instance["log"].append(self.__log("Creating instance {0}".format(id)))
    self.instanceTimelineAdd(instance, "station", "BEGIN", "ARRIVE", owner_code)
    self.saveInstance(id, instance)
    self.progressInstance(id, owner_code = owner_code)
    return id

  def resurrectInstance(self, id, bookmark, owner_code = None):
    bookmark = int(bookmark)
    instance = self.loadInstance(id);
    instance["log"].append(self.__log("Resurrecting to {0}".format(bookmark)))
    self.instanceTimelineAdd(instance, "station", "ERROR", "DEPART", owner_code)
    config_item = self.landscape["map"][instance["map_code"]]["config"][bookmark]
    instance["log"].append(self.__log("Found station {0}".format(config_item["code"])))
    instance["station_code"] = config_item["code"]
    if instance["station_code"] == "BEGIN":
      self.progressInstance(id, owner_code = owner_code)
    self.instanceTimelineAdd(instance, "station", instance["station_code"], "ARRIVE", owner_code)
    self.saveInstance(id, instance)

  def progressInstance(self, id, action_code = None, owner_code = None):
    step_limit = 3
    instance = self.loadInstance(id)
    instance["log"].append(self.__log("Loaded instance {0}".format(id)))
    config = self.landscape["map"][instance["map_code"]]["config"]
    bookmark = None
    for i in range(len(config)):
      if config[i]["type"] == "station" and config[i]["code"] == instance["station_code"]:
        bookmark = i
        instance["log"].append(self.__log("Set bookmark to {0}".format(i)))
    if bookmark == None:
      instance["log"].__log("Unable to identify an active station for instance {0}'s {1} station".format(id, instance["station_code"]))
      instance["station_code"] = "ERROR"
    else:
      if action_code != None:
        instance["log"].append(self.__log("Taking action {0} on {1}".format(action_code, instance["station_code"])))
        leads_to = None
        actions = self.landscape["map"][instance["map_code"]]["config"][bookmark]["actions"]
        for a in range(len(actions)):
          instance["log"].append(self.__log("Considering action {0}: {1}".format(a, json.dumps(actions[a]))))
          if actions[a]["code"] == action_code and "leads_to" in actions[a].keys():
            leads_to = actions[a]["leads_to"]
        if leads_to != None:
          instance["log"].append(self.__log("Action {0} lead to {1}".format(action_code, leads_to)))
          self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "DEPART", owner_code)
          bookmark = leads_to
          self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "ARRIVE", owner_code)
      while step_limit > 0 and instance["station_code"] != "ERROR" and instance["station_code"] != "END":
        instance["log"].append(self.__log("Taking a step..."))
        while "leads_to" in config[bookmark].keys() and config[bookmark]["type"] != "service":
          self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "DEPART", owner_code)
          bookmark = config[bookmark]["leads_to"]
          self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "ARRIVE", owner_code)
          instance["log"].append(self.__log("Shifted bookmark to {0}".format(bookmark)))
        if config[bookmark]["type"] == "router":
          instance["log"].append(self.__log("Evaluating router {0}".format(config[bookmark]["code"])))
          router = self.landscape["router"][config[bookmark]["code"]]
          leads_to = None
          for config_action in config[bookmark]["actions"]:
            vars = list()
            vars.append("class vars:")
            for k, v in instance["vars"].items():
              if isinstance(v, str):
                v = "\"{0}\"".format(v)
              vars.append("  {0} = {1}".format(k, v))
            expression = None
            router_action_code = ""
            for router_action in router["actions"]:
              if config_action["code"] == router_action["action_code"]:
                router_action_code = router_action["action_code"]
                expression = "globals()[\"router_result\"] = ({0})".format(router_action["expression"])
            if leads_to == None and expression != None:
              expression = "\n".join([ "\n".join(vars), expression ])
              try:
                globals()["router_result"] = False
                exec(expression)
                instance["log"].append(self.__log("Evaluated...\n{0}\n...to\n{1}\n...for config action {2}".format(expression, globals()["router_result"], config_action["code"])))
                if globals()["router_result"]:
                  leads_to = config_action["leads_to"]
              except Exception as e:
                instance["log"].append(self.__log("ERROR: Evaluating...\n{0}\n...for router {1}:{2}.\nError message: {3}".format(expression, config[bookmark]["code"], router_action_code, str(e))))
                instance["station_code"] = "ERROR"
                break
          if leads_to != None:
            self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "DEPART", owner_code)
            bookmark = leads_to
            self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "ARRIVE", owner_code)
            instance["log"].append(self.__log("Shifted bookmark to {0}".format(bookmark)))
          else:
            instance["log"].append(self.__log("ERROR: Unable to resolve router to a new step."))
            instance["station_code"] = "ERROR"
            break
        elif config[bookmark]["type"] == "service":
          instance["log"].append(self.__log("Evaluating service {0}".format(config[bookmark]["code"])))
          service = self.landscape["service"][config[bookmark]["code"]]
          url = service["url_template"]
          for k, v in instance["vars"].items():
            var = "{" + k + "}"
            val = str(v)
            instance["log"].append(self.__log("Replacing {0} with {1}".format(var, val)))
            url = url.replace(var, val)
          instance["log"].append(self.__log("Generated URL {0}".format(url)))
          try:
            content = requests.get(url).text
            new_vars = json.loads(content)
            for k, v in new_vars.items():
              instance["log"].append(self.__log("{0} = {1}".format(k, v)))
              instance["vars"][k] = v
            self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "DEPART", owner_code)
            bookmark = config[bookmark]["leads_to"]
            self.instanceTimelineAdd(instance, config[bookmark]["type"], config[bookmark]["code"], "ARRIVE", owner_code)
            instance["log"].append(self.__log("Shifted bookmark to {0}".format(bookmark)))
          except Exception as e:
            instance["log"].append(self.__log("ERROR: {0}".format(str(e))))
            instance["station_code"] = "ERROR"
            break
        elif config[bookmark]["type"] == "station":
          instance["station_code"] = config[bookmark]["code"]
          instance["log"].append(self.__log("Found the next station, coming to rest on {0}".format(instance["station_code"])))
          break
        else:
          instance["log"].append(self.__log("ERROR: Unable to process node {0}".format(json.dumps(config[bookmark]))))
          instance["station_code"] = "ERROR"
          break
        step_limit -= 1
    self.saveInstance(id, instance)
    instance["log"].append(self.__log("Saved instance {0}".format(id)))
    if instance["station_code"] == "END":
      src = os.path.join(self.__path(pbpmFileEnum.active),   "{0}.json".format(id))
      dst = os.path.join(self.__path(pbpmFileEnum.complete), "{0}.json".format(id))
      os.rename(src, dst)
      instance["log"].append(self.__log("Found END, moving to {0}".format(dst)))
      step_limit = 0
    return instance

  def activeInstances(self):
    path = self.__path(pbpmFileEnum.active)
    ret = dict()
    for entry in os.listdir(path):
      id, ext = os.path.splitext(entry)
      instance = self.loadInstance(id)
      record = dict()
      record["station_code"] = instance["station_code"] if "station_code" in instance.keys() else None
      record["owner_code"]   = instance["owner_code"]   if "owner_code"   in instance.keys() else None
      record["map_code"]     = instance["map_code"]     if "map_code"     in instance.keys() else None
      ret[id] = record
    return ret

  def get(self):
    return self.path

