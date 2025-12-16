-- CreateTable
CREATE TABLE "sso_provider" (
    "sso_provider_id" SERIAL NOT NULL,
    "issue" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "oidc_config" TEXT NOT NULL,
    "saml_config" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain_verified" BOOLEAN NOT NULL,

    CONSTRAINT "sso_provider_pkey" PRIMARY KEY ("sso_provider_id")
);
