-- SQLite cannot add a UNIQUE constraint with ALTER TABLE after Hibernate creates
-- the table in ddl-auto=update mode. Enforce the invariant with an explicit index.
CREATE UNIQUE INDEX IF NOT EXISTS uk_products_pokemon_id ON products(pokemon_id);
