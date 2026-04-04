This folder contains configuration files used by Certbot, the tool for obtaining and renewing SSL/TLS certificates from https://letsencrypt.org/.

## Purpose

To Store Certbot configuration files.
Persist certificate data (e.g., keys, certs, renewal configs).
Maintain state between container restarts when using Certbot in a Dockerized environment.

## Typical Contents

- live/ – Symlinks to the latest certificates.
- archive/ – Historical versions of certificates.
- renewal/ – Renewal configuration files for each domain.
- options-ssl-nginx.conf – Recommended SSL settings for Nginx.
- ssl-dhparams.pem – Diffie-Hellman parameters for enhanced security.

## Security Note

This folder may contain private keys and sensitive certificate data.

Ensure it is:

- Excluded from version control (.gitignore)
- Properly secured in production environments
