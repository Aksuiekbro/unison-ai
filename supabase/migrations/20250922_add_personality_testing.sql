-- Add personality_test_completed field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS personality_test_completed boolean DEFAULT false;

-- Insert personality test questions
INSERT INTO questionnaires (question_text, question_type, category, is_active, order_index) VALUES
('Опишите ваш самый большой провал и чему он вас научил?', 'open_text', 'problem_solving', true, 1),
('Расскажите о ситуации, когда вам пришлось принять сложное решение в условиях неопределенности. Как вы действовали?', 'open_text', 'decision_making', true, 2),
('Опишите проект или задачу, которую вы выполнили самостоятельно от начала до конца. Что вас мотивировало?', 'open_text', 'initiative', true, 3),
('Расскажите о ситуации, когда вы работали в команде и возник конфликт. Как вы его разрешили?', 'open_text', 'teamwork', true, 4),
('Что вас больше всего мотивирует в работе? Приведите конкретный пример из вашего опыта.', 'open_text', 'motivation', true, 5),
('Опишите ситуацию, когда вы получили критическую обратную связь. Как вы на неё отреагировали?', 'open_text', 'growth', true, 6),
('Расскажите о времени, когда вам пришлось изучить что-то совершенно новое для работы. Как вы подошли к этому?', 'open_text', 'learning', true, 7)
ON CONFLICT (question_text) DO NOTHING;