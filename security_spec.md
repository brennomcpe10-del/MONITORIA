# Security Specification - Monitoria Matemática 3º Ano C

## 1. Data Invariants
- A **Question** must belong to a topic and have a valid set of options and correct index.
- A **QuizResult** must be linked to a specific user and contain valid score data.
- **User Roles** are immutable once set by the system (or only modifiable by an existing monitor).
- **History Warning**: Students can only see their own `lastMissedQuestionIds`.

## 2. The "Dirty Dozen" Payloads (Unauthorized Attempts)
1. **Student Create Question**: `create` request to `/questions` by student. (Expected: DENIED)
2. **Student Delete Question**: `delete` request to `/questions/{id}` by student. (Expected: DENIED)
3. **Student Read Others Results**: `list` on `/quiz_results` where `userId != auth.uid`. (Expected: DENIED)
4. **Self-Promotion**: `update` on `/users/{uid}` setting `role: "monitor"`. (Expected: DENIED)
5. **Spoofed Quiz Result**: `create` on `/quiz_results` with `userId: "other_uid"`. (Expected: DENIED)
6. **Resource Exhaustion**: `create` on `/questions` with 1MB text field. (Expected: DENIED via size checks)
7. **Phantom User**: `create` on `/users/attacker_uid` with `role: "monitor"`. (Expected: DENIED if not using a protected onboarding)
8. **Unauthenticated Read**: `get` on `/questions` without login. (Expected: DENIED)
9. **History Tampering**: `delete` on `/quiz_results/{id}` by student. (Expected: DENIED)
10. **Result Manipulation**: `update` on `/quiz_results/{id}` to change `score`. (Expected: DENIED - Results are immutable)
11. **PII Leak**: `list` on `/users` to scrape student emails. (Expected: DENIED)
12. **Question Poisoning**: `update` on `/questions/{id}` by someone not in the monitors list. (Expected: DENIED)

## 3. Test Runner (Conceptual)
// All these payloads would be rejected by the rules below.
