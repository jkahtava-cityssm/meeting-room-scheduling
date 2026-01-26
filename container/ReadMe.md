wsl hostname -I

netsh interface portproxy add v4tov4 listenport=80 listenaddress=10.0.0.21 connectport=80 connectaddress=172.18.108.50
netsh interface portproxy add v4tov4 listenport=443 listenaddress=10.0.0.21 connectport=443 connectaddress=172.18.108.50