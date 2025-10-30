RUN:

- Clone
- npm install
- npx prisma generate

DOCKER

- Setup to use ducknds.org domain for testing
- collects a certificate from letsencrypt using certbot

Home Lab

- Port Forward 80 and 443 to machine
- Open Firewall.
- Install WSL
- WSL Make Init
  - sudo apt update
  - sudo apt install make
  - add folder to Docker Desktop Settings > Resource > File Share
- Install Docker Desktop/Alternative
