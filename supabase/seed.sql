insert into managers (name, email, daily_capacity)
values
  ('Анна Петрова', 'manager1@demo.local', 10),
  ('Илья Смирнов', 'manager2@demo.local', 10),
  ('Мария Ковалёва', 'manager3@demo.local', 10),
  ('Олег Морозов', 'manager4@demo.local', 10),
  ('Елена Новикова', 'manager5@demo.local', 10)
on conflict do nothing;
