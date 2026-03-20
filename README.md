# Order Backend Service

Order management microservice for the SE4010 Cloud Computing assignment. This service handles cart, discounts, and order lifecycle operations and is designed to run as a containerized workload on AWS ECS Fargate.

## 1) Microservice Scope (LO1, LO3)

### Service Role
- Owns order-domain workflows for the group system.
- Exposes APIs to manage cart state, apply discounts, and create and track orders.

### Endpoints
- Swagger UI: `/api-docs`
- OpenAPI JSON: `/openapi.json`
- Service health: `/health`
- Service readiness: `/ready`

Main route groups:
- `/api/cart`
- `/api/discounts`
- `/api/orders`

## 2) API Contract (Deliverable)

This project includes a complete OpenAPI 3.0 contract served by the app itself.

- View interactive documentation at `/api-docs`
- Raw contract available at `/openapi.json`

## 3) DevOps Practices (LO1, LO2)

### Source Control
- Public GitHub repository with branch-based workflow.

### CI
- Pull request build validation via GitHub Actions.
- Pipeline file: `.github/workflows/ci.yml`
- Current checks:
  - Install dependencies
  - Generate Prisma client
  - TypeScript build
  - Docker image build

### CD
- Automatic deployment to AWS ECS on push to `main`.
- Pipeline file: `.github/workflows/deploy.yml`
- Flow:
  - Build and push image to Amazon ECR
  - Render ECS task definition with the new image
  - Deploy updated task to ECS service

## 4) DevSecOps and Security Measures (LO2, LO4)

### Runtime Security
- `helmet` for common HTTP security headers.
- JWT middleware for protected routes.
- Input validation for request bodies using Joi.

### Deployment Security
- GitHub OIDC-based AWS authentication in deployment workflow.
- Principle of least privilege expected through scoped IAM role in `AWS_ROLE_TO_ASSUME`.
- Sensitive local environment files excluded via `.gitignore`.

### Security Scanning
- Snyk workflow added: `.github/workflows/security-snyk.yml`
- Includes:
  - Dependency vulnerability scan
  - Container image vulnerability scan
  - SARIF upload for GitHub code scanning view

Required GitHub secret:
- `SNYK_TOKEN`

## 5) Cloud Deployment (LO2, LO4)

### Containerization
- Multi-stage Docker build in `Dockerfile`.

### Registry
- Amazon ECR repository stores built images.

### Orchestration
- AWS ECS Fargate service deployment.

### Public Accessibility
- Expose ECS service through public load balancer (document final URL in report).

## 6) Inter-Service Communication (Assignment Requirement)

This service is prepared for integration with other group services through order/cart/discount APIs.

Document and demonstrate at least one real integration during viva:
- Example A: Product service sends product data used by cart item operations.
- Example B: Payment service consumes order-created events.
- Example C: User/auth service issues JWT consumed by this service.

Include in report:
- Calling service and called service
- Endpoint or message channel used
- Sample request/response or event payload
- Failure handling strategy

## 7) Architecture Diagram Section (Report Input)

Add the group-level architecture diagram showing:
- All 4 microservices
- API Gateway / ingress
- Message broker (if used)
- Datastores
- Deployment targets (ECS/Kubernetes/etc.)
- Security boundaries (IAM roles, security groups, private/public subnets)

## 8) Local Development

### Prerequisites
- Node.js 20+
- npm 10+

### Install and Run
1. Install dependencies:
	`npm ci`
2. Generate Prisma client:
	`npx prisma generate`
3. Run in development mode:
	`npm run dev`

### Build and Run (Production Mode)
1. Build:
	`npm run build`
2. Start:
	`npm start`

## 9) Environment Variables

Create a local `.env` file and set values such as:
- `PORT`
- `JWT_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `RABBITMQ_URL`

Do not commit secrets to Git.

## 10) Docker

Build:
- `docker build -t order-backend .`

Run:
- `docker run -p 3000:3000 --env-file .env order-backend`

## 11) Demonstration Checklist (10 mins)

1. Show deployed service URL and `/health` endpoint.
2. Show one end-to-end business flow from `/api-docs`.
3. Show inter-service integration with another member service.
4. Trigger CI on a PR and explain checks.
5. Show CD deployment to ECS from `main`.
6. Show Snyk scan results and explain mitigation.
7. Explain IAM/security controls briefly.

## 12) Challenges and Improvements Log (Report Input)

Track these in your report:
- Individual implementation challenges
- Integration issues across services
- Security issues found and fixes
- Cloud deployment issues and resolutions

## 13) Repository Evidence Checklist

Ensure the repository contains:
- Source code for microservice
- OpenAPI contract exposure (`/api-docs`, `/openapi.json`)
- CI/CD workflow files
- Dockerfile
- Cloud task definition/configuration
