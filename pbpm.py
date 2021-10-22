# -*- coding: iso-8859-15 -*-

"""
Python Business Process Modelling Class Definitions
"""

from datetime import datetime
import os, json, enum, sys

class pbpmFileEnum(enum.Enum):
  landscape = 1
  log = 2

class pbpm:

  """
  The main class through which a process modelling instance is coordinated.
  """

  path = None
  landscape = dict()

  def __path(self, file_code):
    ret = None
    ret = os.path.join(self.path, "landscape.json") if file_code == pbpmFileEnum.landscape else ret
    ret = os.path.join(self.path, "{0}.log".format(datetime.now().strftime("%Y%m%d"))) if file_code == pbpmFileEnum.log else ret
    return ret

  def __mend(self):
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

  def __log(self, entry):
    dt = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
    line = "{0} - {1}\n".format(dt, entry)
    fout = open(self.__path(pbpmFileEnum.log), "a")
    fout.write(line)
    fout.close()

  def __init__(self, path = None):
    """
    Initialise a pbpm instance.
    :param path: The folder in which this pbpm should read and write it's process modelling work.
    """
    assert path != None, "The pbpm class must be initialised referencing a folder in which it can maintain it's state."
    assert os.path.exists(path), "The pbpm_config_path specified ({0}) does not exist.".format(path)
    assert os.access(path, os.W_OK), "The pbpm_config_path specified ({0}) is not writable.".format(path)
    self.path = path
    self.load()

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
      ds = [ "map", "station", "service", "owner" ]
      for d in ds:
        self.landscape[d] = dict()
      print("Loaded configuration from {0}".format(self.path))
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

  def get(self):
    return self.path

