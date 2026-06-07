import urllib.request
from urllib.error import HTTPError
import json

try:
    urllib.request.urlopen('http://localhost:8000/api/flowers')
except HTTPError as e:
    print(e.read().decode())
