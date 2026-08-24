# Project Status

Version: v1.5 WP4R.2 explicit Istanbul coverage path

WP4R: INCONCLUSIVE — coverage contract blocked evaluation  
WP4R.1: COMPLETE — explicit path strongly supported  
WP4R.1a: COMPLETE — V8 JSON CONFIRMED  
WP4R.2: CURRENT  
WP4R usefulness rerun: BLOCKED

## Current Implementation Goal

Add:

```text
--coverage-file <path>
```

while preserving the default:

```text
coverage/coverage-final.json
```

## Architectural Boundary

The caller generates coverage.

The prototype only consumes an explicitly supplied or default Istanbul JSON
artifact.

No test execution or coverage generation is authorized.
