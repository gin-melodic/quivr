-- Update brain table
-- Add support for ChatGLM2-6B

-- Alter brains table, add Columns "type", "url", "top_p"
ALTER TABLE brains ADD COLUMN type TEXT;
ALTER TABLE brains ADD COLUMN url TEXT;
ALTER TABLE brains ADD COLUMN top_p FLOAT;


-- Update migrations table
INSERT INTO migrations (name) 
SELECT '202308311122370_brain_support_other_type'
WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE name = '202308311122370_brain_support_other_type'
);

COMMIT;
