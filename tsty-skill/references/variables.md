# Variable Interpolation & Faker.js Integration

Complete guide to dynamic variables and test data generation in Tsty flows.

---

## Table of Contents

1. [Overview](#overview)
2. [Built-in Variables](#built-in-variables)
3. [Faker.js Integration](#fakerjs-integration)
4. [Usage in Flows](#usage-in-flows)
5. [Advanced Patterns](#advanced-patterns)

---

## Overview

Tsty supports dynamic variable interpolation using `${variable}` syntax. Variables are replaced at runtime with actual values, enabling:

- Unique test data per run (timestamps, random IDs)
- Realistic fake data (names, emails, addresses)
- Configuration values (baseUrl, credentials)
- Custom variables

---

## Built-in Variables

### Timestamps

| Variable | Format | Example |
|----------|--------|---------|
| `${timestamp}` | Unix timestamp (ms) | `1738843200000` |
| `${datetime}` | YYYY-MM-DD-HH-mm-ss | `2026-02-06-10-30-45` |
| `${date}` | YYYY-MM-DD | `2026-02-06` |
| `${time}` | HH-mm-ss | `10-30-45` |

**Use cases:**
- Unique identifiers
- File names
- Time-sensitive tests

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='username']",
  "value": "test-user-${timestamp}"
}
// Result: "test-user-1738843200000"
```

### Random Values

| Variable | Format | Example |
|----------|--------|---------|
| `${random}` | 6-char hex | `a3f9c2` |
| `${uuid}` | 8-char hex (short UUID) | `7f2b8e1a` |

**Use cases:**
- Unique test identifiers
- Avoid collisions in concurrent tests
- Random data generation

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='email']",
  "value": "test-${uuid}@example.com"
}
// Result: "test-7f2b8e1a@example.com"
```

### Configuration Values

| Variable | Source | Example |
|----------|--------|---------|
| `${baseUrl}` | config.json | `http://localhost:3000` |
| `${credentials.email}` | config.json | `test@example.com` |
| `${credentials.password}` | config.json | `password123` |

**Use cases:**
- Environment-specific URLs
- Reusable credentials
- Configuration-driven tests

**Example:**
```json
{
  "type": "goto",
  "url": "${baseUrl}/login"
}
// Result: "http://localhost:3000/login"
```

---

## Faker.js Integration

Tsty integrates [Faker.js](https://fakerjs.dev/api/) for realistic test data generation.

### Person Data

| Variable | Example Output |
|----------|----------------|
| `${faker.person.fullName}` | "Jane Smith" |
| `${faker.person.firstName}` | "Jane" |
| `${faker.person.lastName}` | "Smith" |
| `${faker.person.jobTitle}` | "Software Engineer" |
| `${faker.person.prefix}` | "Dr." |
| `${faker.person.suffix}` | "Jr." |

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='name']",
  "value": "${faker.person.fullName}"
}
// Result: "Jane Smith"
```

### Internet Data

| Variable | Example Output |
|----------|----------------|
| `${faker.internet.email}` | "jane.smith@example.com" |
| `${faker.internet.userName}` | "jane.smith123" |
| `${faker.internet.password}` | "xY7$mK9pL2" |
| `${faker.internet.url}` | "https://example.com" |
| `${faker.internet.domainName}` | "example.com" |
| `${faker.internet.ipv4}` | "192.168.1.1" |

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='email']",
  "value": "${faker.internet.email}"
}
// Result: "jane.smith@example.com"
```

### Location Data

| Variable | Example Output |
|----------|----------------|
| `${faker.location.streetAddress}` | "123 Main St" |
| `${faker.location.city}` | "San Francisco" |
| `${faker.location.state}` | "California" |
| `${faker.location.country}` | "United States" |
| `${faker.location.zipCode}` | "94102" |
| `${faker.location.latitude}` | "37.7749" |
| `${faker.location.longitude}` | "-122.4194" |

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='address']",
  "value": "${faker.location.streetAddress}, ${faker.location.city}, ${faker.location.state}"
}
// Result: "123 Main St, San Francisco, California"
```

### Phone & Company

| Variable | Example Output |
|----------|----------------|
| `${faker.phone.number}` | "+1-555-123-4567" |
| `${faker.company.name}` | "Acme Corporation" |
| `${faker.company.catchPhrase}` | "Innovative solutions for tomorrow" |

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='phone']",
  "value": "${faker.phone.number}"
}
// Result: "+1-555-123-4567"
```

### Text Generation

| Variable | Example Output |
|----------|----------------|
| `${faker.lorem.sentence}` | "Lorem ipsum dolor sit amet." |
| `${faker.lorem.paragraph}` | "Lorem ipsum dolor sit amet, consectetur..." |
| `${faker.lorem.words}` | "lorem ipsum dolor" |
| `${faker.lorem.word}` | "lorem" |

**Example:**
```json
{
  "type": "fill",
  "selector": "textarea[name='description']",
  "value": "${faker.lorem.paragraph}"
}
// Result: "Lorem ipsum dolor sit amet, consectetur..."
```

### Numbers & Strings

| Variable | Example Output |
|----------|----------------|
| `${faker.number.int}` | "42" |
| `${faker.number.int({"min": 1, "max": 100})}` | "73" |
| `${faker.number.float}` | "3.14159" |
| `${faker.string.alphanumeric(10)}` | "a3f9c2x7m1" |
| `${faker.string.alpha(5)}` | "abcde" |
| `${faker.string.numeric(6)}` | "123456" |

**Example:**
```json
{
  "type": "fill",
  "selector": "input[name='age']",
  "value": "${faker.number.int({\"min\": 18, \"max\": 99})}"
}
// Result: "42"
```

### Full Faker API

**See complete API:** https://fakerjs.dev/api/

Categories include:
- `faker.person.*` - Person data
- `faker.internet.*` - Internet/email data
- `faker.location.*` - Geographic data
- `faker.phone.*` - Phone numbers
- `faker.company.*` - Company data
- `faker.lorem.*` - Text generation
- `faker.number.*` - Numeric data
- `faker.string.*` - String generation
- `faker.date.*` - Date/time data
- `faker.finance.*` - Financial data
- `faker.commerce.*` - E-commerce data
- And 20+ more categories!

---

## Usage in Flows

### In Primitive Actions

```json
{
  "name": "Fill Registration Form",
  "primitives": [
    { 
      "type": "fill", 
      "selector": "input[name='name']", 
      "value": "${faker.person.fullName}" 
    },
    { 
      "type": "fill", 
      "selector": "input[name='email']", 
      "value": "${faker.internet.email}" 
    },
    { 
      "type": "fill", 
      "selector": "input[name='phone']", 
      "value": "${faker.phone.number}" 
    }
  ]
}
```

### In Action Definitions

```json
// .tsty/actions/fill-registration.action.json
{
  "type": "form",
  "description": "Fill registration form with dynamic data",
  "primitives": [
    { "type": "fill", "selector": "#name", "value": "${faker.person.fullName}" },
    { "type": "fill", "selector": "#email", "value": "${faker.internet.email}" },
    { "type": "fill", "selector": "#phone", "value": "${faker.phone.number}" }
  ]
}
```

### In URLs

```json
{
  "type": "goto",
  "url": "${baseUrl}/user/${uuid}/profile"
}
// Result: "http://localhost:3000/user/7f2b8e1a/profile"
```

### In Assertions

```json
{
  "type": "text",
  "selector": ".welcome-message",
  "expected": "Welcome, ${faker.person.firstName}!"
}
// Note: Faker values change per run, so this is best for verification, not exact matching
```

---

## Advanced Patterns

### Combining Variables

```json
{
  "value": "test-${date}-${random}@example.com"
}
// Result: "test-2026-02-06-a3f9c2@example.com"
```

### Using in Flow Names

```json
{
  "name": "User Registration Test - ${datetime}",
  "steps": [...]
}
// Result: "User Registration Test - 2026-02-06-10-30-45"
```

### Reproducible Test Data (Seed)

Variables are interpolated at runtime. For reproducible Faker data, use seeded generation (requires configuration - see CONFIG.md).

### Custom Variables

Custom variables can be passed via interpolation context (programmatic usage):

```typescript
const context = {
  config: loadConfig(),
  customVars: {
    testEnvironment: 'staging',
    apiVersion: 'v2'
  }
};

// Then use: ${testEnvironment}, ${apiVersion}
```

### Escaping Variables

To use literal `${...}` without interpolation:
- Not currently supported
- Workaround: Use different delimiter or avoid in test data

---

## Best Practices

### ✅ Do

- Use `${timestamp}` or `${uuid}` for unique identifiers
- Use Faker for realistic test data (names, emails, etc.)
- Use `${baseUrl}` for environment-agnostic URLs
- Combine variables for complex patterns
- Document which variables are used in flows

### ❌ Don't

- Use Faker in exact text assertions (values change per run)
- Hard-code environment-specific values (use `${baseUrl}`)
- Use overly complex Faker expressions (keep it simple)
- Forget to handle variable interpolation failures

---

## Troubleshooting

### Variable Not Replaced

**Symptom:** `${variable}` appears literally in output

**Causes:**
- Variable name is misspelled
- Variable doesn't exist in context
- Interpolation is disabled (check config)

**Fix:**
- Verify variable name matches exactly
- Check available variables in CONFIG.md
- Ensure interpolation is enabled

### Faker Expression Fails

**Symptom:** Error: "Cannot read property 'X' of undefined"

**Causes:**
- Faker API method doesn't exist
- Syntax error in Faker expression
- Missing parameters

**Fix:**
- Check Faker API docs: https://fakerjs.dev/api/
- Verify method exists and syntax is correct
- Use simpler expression or test in isolation

---

## Related Guides

- **[FLOW-STRUCTURE.md](FLOW-STRUCTURE.md)** - How to use variables in flow JSON
- **[ACTIONS.md](ACTIONS.md)** - How to use variables in actions
- **[CONFIG.md](CONFIG.md)** - Configuration values available as variables
- **[EXAMPLES.md](EXAMPLES.md)** - Real-world variable usage examples

---

**Last Updated:** 2026-02-06
**Faker.js Version:** 8.x
**Faker.js Docs:** https://fakerjs.dev/api/
