-- Migration script
BEGIN;

-- Drop the old function if exists
DROP FUNCTION IF EXISTS match_vectors(VECTOR(1536), INT, TEXT);
DROP FUNCTION IF EXISTS match_summaries(query_embedding VECTOR(1536), match_count INT, match_threshold FLOAT);

-- Alter embedding column to 768
ALTER TABLE vectors ALTER COLUMN embedding TYPE VECTOR(768);

-- Create the new function
CREATE OR REPLACE FUNCTION match_vectors(query_embedding VECTOR(768), match_count INT, p_brain_id UUID)
RETURNS TABLE(
    id BIGINT,
    brain_id UUID,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(768),
    similarity FLOAT
) LANGUAGE plpgsql AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT
        vectors.id,
        brains_vectors.brain_id,
        vectors.content,
        vectors.metadata,
        vectors.embedding,
        1 - (vectors.embedding <=> query_embedding) AS similarity
    FROM
        vectors
    INNER JOIN
        brains_vectors ON vectors.id = brains_vectors.vector_id
    WHERE brains_vectors.brain_id = p_brain_id
    ORDER BY
        vectors.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;


CREATE OR REPLACE FUNCTION match_summaries(query_embedding VECTOR(768), match_count INT, match_threshold FLOAT)
RETURNS TABLE(
    id BIGINT,
    document_id UUID,
    content TEXT,
    metadata JSONB,
    embedding VECTOR(768),
    similarity FLOAT
) LANGUAGE plpgsql AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT
        id,
        document_id,
        content,
        metadata,
        embedding,
        1 - (summaries.embedding <=> query_embedding) AS similarity
    FROM
        summaries
    WHERE 1 - (summaries.embedding <=> query_embedding) > match_threshold
    ORDER BY
        summaries.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

INSERT INTO migrations (name) 
SELECT '2023090116370_update_vectors_len_768'
WHERE NOT EXISTS (
    SELECT 1 FROM migrations WHERE name = '2023090116370_update_vectors_len_768'
);

COMMIT;
