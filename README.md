# Хронолента выдающихся людей

Статический сайт с интерактивной шкалой времени и админкой для CRUD персон.

## Что теперь есть

- `/scale/index.html` — публичная шкала.
- `/scale/admin.html` — админка (добавить/изменить/удалить персон).
- `Supabase` интеграция для хранения данных в интернете.
- Fallback в `localStorage`, если Supabase не настроен.

## Локальный запуск

1. Откройте `/scale/index.html`.
2. Для управления персоналиями откройте `/scale/admin.html`.

## Бесплатный деплой

Можно бесплатно разместить фронт на:

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [GitHub Pages](https://pages.github.com/)
- [Vercel Hobby](https://vercel.com/pricing)
- [Netlify Free](https://www.netlify.com/pricing/)

Так как сайт статический, backend-хостинг не нужен.

### Быстрый деплой на GitHub Pages

1. Создайте репозиторий и загрузите файлы проекта.
2. В GitHub откройте `Settings -> Pages`.
3. В `Build and deployment` выберите:
   - `Source: Deploy from a branch`
   - `Branch: main` (или ваша ветка), папка `/root`
4. Сохраните. Через 1-2 минуты сайт будет доступен по URL GitHub Pages.

### Быстрый деплой на Cloudflare Pages

1. Создайте проект в [Cloudflare Pages](https://developers.cloudflare.com/pages/).
2. Подключите Git-репозиторий.
3. Build settings:
   - `Framework preset: None`
   - `Build command: (пусто)`
   - `Build output directory: /`
4. Запустите деплой.

## Настройка Supabase (для сохранения изменений из админки)

1. Создайте проект в [Supabase](https://supabase.com/).
2. В SQL Editor выполните файл:
   - `/scale/supabase/schema.sql`
3. В Supabase Auth создайте администратора (email/password).
4. Добавьте этого пользователя в `public.admin_users`:
   - `insert into public.admin_users (user_id) values ('UUID_ПОЛЬЗОВАТЕЛЯ');`
5. Скопируйте:
   - `/scale/supabase-config.example.js`
   - в `/scale/supabase-config.js`
6. Заполните `url` и `anonKey`.

После этого:

- публичная шкала читает данные из Supabase,
- админка сохраняет изменения в Supabase.

## Важно по безопасности

- Используйте только `anon key` на клиенте.
- Никогда не вставляйте `service_role key` в frontend.
- Запись ограничена RLS-политиками и таблицей `admin_users`.

## Формат данных персоны

Минимальные поля:

- `id` (slug, например `einstein`)
- `name`
- `category`
- `birthYear`
- `deathYear` (или `is_living = true`)
- `summary`
- `achievements` (массив строк)

## Файлы интеграции

- `/scale/data-service.js` — общий слой данных (Supabase + localStorage).
- `/scale/supabase/schema.sql` — таблицы и политики.
- `/scale/admin.js` — логика админки.
- `/scale/admin.css` — стили админки.
