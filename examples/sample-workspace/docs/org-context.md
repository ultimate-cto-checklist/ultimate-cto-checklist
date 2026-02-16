# Acme Corp - Organization Context

Acme Corp runs its backend on AWS using Kubernetes and Lambda. Infrastructure is managed with Terraform. The team uses GitHub (cloud) for source control with GitHub Actions for CI/CD.

Monitoring is handled by Datadog, error tracking by Sentry, and logs go to CloudWatch. Secrets are stored in AWS Secrets Manager. Authentication uses Auth0.

## Projects

- **acme-api** - Node.js/TypeScript backend API with Postgres
- **acme-web** - React/Next.js frontend application
