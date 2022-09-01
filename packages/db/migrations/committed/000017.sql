--! Previous: sha1:f3e729fa9e901a56959b9869cf1e299d38da39f5
--! Hash: sha1:29fb07e2bc76309db755f59da4d72bb8626f109e

--! split: 1-current.sql
-- Enter migration here
alter type contact_quality add value if not exists 'INNING_ENDING_DEAD_BALL';
