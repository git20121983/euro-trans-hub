## План: Автоматизований онбординг водія

### 1. База даних (міграція)

**Таблиця `drivers` — нові колонки:**
- `birth_date` (date), `address` (text), `license_expiry` (date)
- `license_front_url`, `license_back_url`, `selfie_url` (text)
- `details_submitted_at`, `verified_at` (timestamptz), `verified_by` (uuid)

**Нові статуси водія** (текстове поле, не enum) — додаємо значення:
- `pending_details` — створено адміном, водій ще не заповнив профіль
- `on_verification` — водій надіслав документи, очікує перевірки адміна
- `available` (existing) — після схвалення

**Storage bucket `driver-docs`** (приватний) з RLS:
- Водій може upload/select свої файли в папку `{driver_id}/...`
- Admin/manager — повний read доступ
- Структура: `{driver_id}/license_front.jpg`, `license_back.jpg`, `selfie.jpg`

**RLS на drivers:**
- Дозволити водію оновлювати власний запис (вже є) — додати поля до allowed
- Admin/manager бачать `on_verification` для нотифікацій

**Зміна `handle_new_user`:** не створювати driver автоматично (буде створювати адмін).

### 2. CRM — спрощена форма додавання водія

`AddDriverModal.tsx`: залишити тільки **ПІБ, телефон, номер посвідчення**. Прибрати email і truck. Запис створюється зі статусом `pending_details`.

### 3. CRM — нотифікації про верифікацію

В `AdminDrivers.tsx`:
- Бейдж "На верифікації: N" угорі сторінки
- Realtime-підписка на `drivers` зі статусом `on_verification`
- Toast при появі нового
- Кнопки **Схвалити / Відхилити** в картці водія → відкриває модалку перегляду документів
- Схвалення: статус → `available`, заповнюються `verified_at`, `verified_by`
- Відхилення: статус → `pending_details` з нотаткою

### 4. Driver App — покрокова анкета

Новий компонент `DriverOnboarding.tsx`:
- Показується якщо `driverRecord.status === 'pending_details'` або `'on_verification'`
- shadcn `<Progress>` зверху (33% / 66% / 100%)
- **Крок 1:** Дата народження, адреса, термін дії посвідчення (Zod-валідація)
- **Крок 2:** 3 поля upload з `<input capture="environment">` для миттєвого фото з камери, прев'ю після завантаження. Файли зберігаються в `driver-docs/{driver_id}/license_front.jpg` тощо.
- **Крок 3:** Підтвердження → статус → `on_verification`, екран "Очікуйте на перевірку адміністратором"

В `DriverDashboard.tsx`: на початку — якщо статус `pending_details` чи `on_verification`, рендерити `<DriverOnboarding>` замість основного UI.

### 5. Авторизація

Залишаємо існуючий email/password (OTP по телефону потребує SMS-провайдер — окреме завдання). Driver реєструється з email і за телефоном його лінкує адмін у наступній ітерації, **АБО** використовуємо існуючий flow: після створення адміном водій реєструється на `/auth` з тим же телефоном, і ми робимо метч по `phone` у `drivers` (auto-link через handle_new_user).

**Рішення:** додати тригер, який при створенні profile з phone авто-лінкує існуючий driver-запис (`drivers.user_id := NEW.user_id WHERE drivers.phone = NEW.phone AND user_id IS NULL`).

### Технічна частина

- Файли: edit `AddDriverModal.tsx`, `AdminDrivers.tsx`, `DriverDashboard.tsx`; create `DriverOnboarding.tsx`, `DriverVerificationModal.tsx`
- Міграція: ALTER TABLE drivers + bucket driver-docs + storage policies + auto-link trigger
- Без змін: AuthPage (працює як раніше)

### OTP по телефону

Не реалізую в цьому проході — потребує налаштування SMS-провайдера (Twilio) і це окреме рішення. Залишаю email/password з авто-лінком по номеру телефону. Якщо потрібен SMS OTP — скажіть, додам через Twilio-конектор.
