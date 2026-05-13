## План: Ролі + розширений фінансовий облік

### 1. Міграція БД

**Ролі.** В проєкті вже є `app_role` enum (`admin`, `manager`, `driver`, `client`) і таблиця `user_roles` з функцією `has_role()`. Це правильна схема (ролі в окремій таблиці, не в `profiles` — інакше privilege escalation). Тому:
- Додам значення `accountant` до існуючого enum `app_role` (НЕ створюю колонку `role` в `profiles` — це антипатерн, який я свідомо не виконую з міркувань безпеки; поясню в чаті).
- Додам колонку `manager_id uuid` в `orders` (FK логічно на `auth.users`, але без жорсткого FK — за конвенцією проєкту).

**Фінансові поля в `orders`:**
- `payment_status` text з CHECK (`unpaid|partially_paid|paid|overdue`), default `unpaid`
- `total_amount numeric` (дебіторка; якщо NULL — fallback на `total_price`)
- `paid_amount numeric default 0`
- `driver_advance numeric default 0`
- `is_international boolean default false`
- `vat_amount numeric` — генерується тригером: 20% від `total_amount` якщо не міжнар., інакше 0
- `unloading_date date` (потрібно для overdue-логіки)

**View `orders_finance`:** додає `debt = total_amount - paid_amount` і обчислений `effective_payment_status` (overdue якщо `debt > 0` і `unloading_date + 14 днів < now()`).

**Тригер:** перед INSERT/UPDATE на `orders` — перерахунок `vat_amount` і автопідняття `payment_status` до `paid` якщо `paid_amount >= total_amount`, до `partially_paid` якщо `0 < paid_amount < total_amount`. Overdue ставиться через view (бо залежить від часу).

### 2. RLS-політики

**`orders`:**
- Admin: повний CRUD (вже є — `Staff can manage orders`, обмежу до admin+manager як було).
- Manager: бачить/редагує лише де `manager_id = auth.uid()`. Замінюю поточну `manager`-частину політики на per-row.
- Accountant: SELECT-only на всі orders.

**Нові таблиці `invoices` і `payments`:**
- `invoices`: `order_id`, `invoice_number`, `amount`, `vat_amount`, `issued_at`, `due_date`, `status`.
- `payments`: `order_id`, `invoice_id`, `amount`, `paid_at`, `method`.
- RLS: admin + accountant — повний CRUD; manager — SELECT тільки по своїх `orders`.

### 3. UI: `FinanceDashboard`

Нова сторінка `/admin/finance-dashboard` (або заміна існуючого `AdminFinance` — об'єдную в один екран із трьома віджетами зверху + таблиця знизу).

Три віджети:
1. **Загальна дебіторка** — `SUM(total_amount - paid_amount)` де `payment_status != 'paid'`.
2. **Активні аванси** — `SUM(driver_advance)` по замовленнях зі статусом `in_transit|unloading`.
3. **Прогноз прибутку** — `SUM(total_amount - vat_amount - fuel_cost - driver_salary - depreciation_cost - toll_cost)` по активних/завершених.

Фільтрація за роллю: RLS вже все відфільтрує — менеджер бачить тільки свої. На фронті лише читаю `useAuth().roles` щоб ховати віджет «Прогноз прибутку компанії» від manager (відкривається admin + accountant).

Маршрут і пункт меню в `AdminSidebar`. Інтерфейс: dark-mode CRM, узгоджений з існуючими картками, мова — українська.

### Технічні деталі

- Міграція через `supabase--migration` (створює файл, потребує підтвердження).
- Після підтвердження — оновлю `AdminFinance.tsx` (додам віджети, дебіторку, фільтр за роллю) і `AdminSidebar.tsx` (за потреби).
- `AuthContext` уже віддає `roles[]` — додам гетер `isAccountant` / `isManager`.
- `manager_id` заповнюється в `CreateOrderModal` (поточний `auth.uid()` менеджера, який створює замовлення) — оновлю модалку.

### Що НЕ роблю і чому

- НЕ додаю `role` в `profiles` — це порушує best-practices Supabase (роль у тій же таблиці = legkий privilege escalation через UPDATE profiles). Використовую існуючу `user_roles` + `has_role()`. Якщо все ж потрібна денормалізація — скажи окремо.
- НЕ використовую CHECK з `now()` — замість цього view + тригер.
