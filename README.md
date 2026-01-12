Scalable Media Distribution Web Application

Module Information
Module: COM769 – Scalable Advanced Software Solutions
Institution: Ulster University
Assessment: Coursework 2 – Mini Project (75%)

1. Project Overview
This project implements a scalable, cloud-native media distribution web application that enables the sharing of photos and videos. The system is conceptually similar to platforms such as Instagram and is designed to demonstrate modern development, deployment, and scalability practices using Microsoft Azure.

2. Key Features
Functional Features:
- Photo and video uploads by creator users
- Metadata management (title, caption, location, people)
- Media browsing and search
- Commenting and rating functionality

Non-Functional Features:
- Cloud-native architecture
- Horizontal scalability
- CI/CD-based deployment
- Monitoring and metrics

3. Technology Stack
Frontend: Azure Static Web Apps
Backend: Azure Functions (REST API)
Storage: Azure Blob Storage
Database: Azure Cosmos DB (NoSQL)
Authentication: Azure Static Web Apps Authentication (Microsoft Entra ID)
Caching: Azure Cache for Redis
CDN: Azure CDN
Monitoring: Azure Application Insights
CI/CD: GitHub Actions

4. Architecture Summary
The frontend is served as a static web application and communicates with backend services via REST APIs. Azure Functions provide stateless, scalable business logic. Media files are uploaded directly to Azure Blob Storage using secure SAS tokens, while metadata, comments, and ratings are stored in Azure Cosmos DB.

5. User Roles
Creator Users:
- Upload photos and videos
- Manage media metadata

Consumer Users:
- Browse and search media
- View, comment on, and rate media

6. Deployment Platform
The application is deployed exclusively on Microsoft Azure using university-provided student credits, in accordance with the coursework requirements.

7. CI/CD Pipeline
GitHub Actions are used to automate the build and deployment of both frontend and backend components, demonstrating modern DevOps practices.

8. Monitoring & Metrics
Azure Application Insights is used to monitor request throughput, latency, error rates, and dependency performance. These metrics support scalability evaluation.

9. Learning Outcomes
This project demonstrates practical application of scalable architectures, cloud-native services, and critical evaluation of system limitations.

10. Author
Student: Shahan Khan
Programme: MSc Computer Science & Technology
University: Ulster University
