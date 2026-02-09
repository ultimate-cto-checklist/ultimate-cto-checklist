---
name: audit-section
description: Focus on a specific checklist section. Lists all items in the section and guides through them.
---

# Audit Section

You are focusing on a specific checklist section.

## Usage

```
/audit-section 01
/audit-section git-repo-setup
/audit-section          # shows section list
```

## Section List

If no section specified, show available sections grouped by domain:

> Available sections:
>
> **Infrastructure & Setup**
> 01. Git Repo Setup ([count] items, [critical] critical)
> 02. Dependencies ([count] items)
> 03. Authentication & Endpoints ([count] items)
> 04. Environments ([count] items)
>
> **Database & Data**
> 05. Database Connections ([count] items)
> 06. Resilience ([count] items)
>
> **Monitoring & Health**
> 07. Health Endpoints ([count] items)
> 08. Testing & Code Metrics ([count] items)
> 09. Development Workflow ([count] items)
> 10. Deployments ([count] items)
>
> **Access & Security**
> 11. Access Control ([count] items)
> 12. Monitoring ([count] items)
> 13. Infrastructure Security ([count] items)
>
> **Documentation & Admin**
> 14. Documentation ([count] items)
> 15. Admin Features ([count] items)
> 16. CTO Workspace ([count] items)
>
> **Performance & Analytics**
> 17. Performance Monitoring ([count] items)
> 18. Analytics ([count] items)
> 19. Error Reporting ([count] items)
> 20. Email Infrastructure ([count] items)
>
> **Frontend & Caching**
> 21. Caching ([count] items)
> 22. Frontend Performance ([count] items)
> 23. Client-Side Security ([count] items)
>
> **Data Management**
> 24. Data Retention ([count] items)
> 25. Intrusion Detection ([count] items)
>
> **High Availability**
> 26. High Availability & Backups ([count] items)
> 27. Database Tooling ([count] items)
>
> **Code & Architecture**
> 28. Code Architecture ([count] items)
> 29. Secrets Management ([count] items)
>
> **API & Security**
> 30. Rate Limiting ([count] items)
> 31. API Design ([count] items)
> 32. Content Security Policy ([count] items)
>
> **Operations**
> 33. Feature Flags ([count] items)
> 34. Rollback & Recovery ([count] items)
> 35. Incident Response ([count] items)
> 36. Load & Stress Testing ([count] items)
>
> **Compliance**
> 37. GDPR & Privacy ([count] items)
> 38. Cost Monitoring ([count] items)
>
> **Team & Development**
> 39. Developer Onboarding ([count] items)
> 40. Technical Debt Tracking ([count] items)
> 41. Accessibility ([count] items)
> 42. Internationalization ([count] items)
>
> Enter section number or name:

Read item counts from `checklist/checklist/[section]/items.yaml`.

## Section Focus

When section selected:

> ## Section [N]: [Name]
>
> [Description from items.yaml]
>
> **Items:** [count] ([critical] critical, [recommended] recommended)
> **Scope:** [org/project/both]
>
> ### Items in this section:
>
> 1. [ID]: [Title] - [severity]
> 2. [ID]: [Title] - [severity]
> ...
>
> Start from the beginning? (y/n/or enter item number)

Then proceed through items sequentially within the section using the standard Item Workflow from `/audit-start`.

## Cross-References

When an item references another section, mention it:

> Note: This item relates to Section [N] ([name]).
> You may want to audit that section as well.

## Progress Tracking

Show progress within the section:

> Section [N] progress: [done]/[total] items ([%]%)

When section is complete:

> Section [N] complete!
>
> Results:
> - Pass: [count]
> - Fail: [count]
> - Skip: [count]
>
> Continue to another section? Run `/audit-section` to pick one.
