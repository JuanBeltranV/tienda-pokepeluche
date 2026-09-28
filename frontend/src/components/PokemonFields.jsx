import { Field } from './Feedback'

// Replace this isolated input block with the Lambda-backed picker in Phase 2.
export default function PokemonFields({ values, onChange, errors }) {
  return (
    <fieldset className="pokemon-fields">
      <legend>Pokémon asociado</legend>
      <p className="form-hint">
        Ingreso manual de prueba. La validación Pokédex se incorporará en la
        siguiente fase.
      </p>
      <div className="form-row">
        <Field label="Número Pokédex" name="pokemonId" errors={errors}>
          <input
            id="pokemonId"
            name="pokemonId"
            type="number"
            min="1"
            max="2147483647"
            step="1"
            required
            value={values.pokemonId}
            onChange={onChange}
            aria-invalid={!!errors.pokemonId}
            aria-describedby={errors.pokemonId ? 'pokemonId-error' : undefined}
          />
        </Field>
        <Field label="Nombre del Pokémon" name="pokemonName" errors={errors}>
          <input
            id="pokemonName"
            name="pokemonName"
            maxLength="100"
            pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*"
            required
            value={values.pokemonName}
            onChange={onChange}
            placeholder="ej. pikachu"
            aria-invalid={!!errors.pokemonName}
            aria-describedby={
              errors.pokemonName ? 'pokemonName-error' : undefined
            }
          />
        </Field>
      </div>
    </fieldset>
  )
}
