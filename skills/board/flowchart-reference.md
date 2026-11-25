# Flowchart draft format

A flowchart draft is `{"flowchart": {...}}`. It can sit alone, or in the same draft as wireframe `frames` (see draft-reference.md).

```json
{
  "flowchart": {
    "direction": "down",
    "steps": [
      { "id": "start", "shape": "terminal", "text": "Start" },
      { "id": "cart", "text": "Open cart" },
      { "id": "empty", "shape": "decision", "text": "Cart empty?" },
      { "id": "browse", "text": "Show suggestions" },
      { "id": "pay", "shape": "io", "text": "Enter payment" },
      { "id": "end", "shape": "terminal", "text": "Done" }
    ],
    "connections": [
      { "from": "start", "to": "cart" },
      { "from": "cart", "to": "empty" },
      { "from": "empty", "to": "browse", "label": "Yes" },
      { "from": "empty", "to": "pay", "label": "No" },
      { "from": "browse", "to": "cart", "dash": "dashed" },
      { "from": "pay", "to": "end" }
    ]
  }
}
```

## flowchart

- `direction`: `"down"` (default, top to bottom) or `"right"` (left to right). Only affects where new steps are placed.
- `steps`: `[Step]`, in reading order. Give every step a short, stable `id` (kebab-case); later drafts change a step by its id.
- `connections`: `[Connection]`. A from/to pair is one connector; naming the same pair again updates it.
- `remove`: step ids (removes the step and its connectors) or `"from->to"` (removes that connector).

## Step

`{ "id", "text", "shape"?, "fill"?, "stroke"?, "x"?, "y"?, "width"?, "height"? }`

- `shape` (default `process`):
  - `process`: a step or action ("Send email")
  - `decision`: a question with branches ("Paid?"), a diamond
  - `terminal`: start or end ("Start", "Done"), a pill
  - `io`: input or output, a form, data in or out ("Enter card"), a slanted box
  - `document`: a document, report or email
  - `database`: stored data
  - `subprocess`: a step defined elsewhere (another chart)
  - `preparation`: setup, or a loop's start
  - `circle`: a junction or jump point, labelled with a letter ("A")
- `text`: the label. Keep it to a few words; a long one wraps and the shape grows taller.
- `fill`: `#rrggbb`. Leave it out for paper white. Use colour sparingly, to group or flag: soft tints read best, like `#fff4cc` (yellow), `#dcf3dc` (green), `#dbe9fb` (blue), `#ffd9d4` (red), `#ffe3cc` (peach), `#f2f1ee` (grey).
- `x`, `y`, `width`, `height`: only to pin a step somewhere; otherwise the layout places it, and a step the user moved stays where they put it.

## Connection

`{ "from", "to", "label"?, "dash"?, "route"?, "arrows"?, "color"? }`

- `from`, `to`: step ids (from this draft, or already on the chart).
- `label`: words on the line, like `"Yes"`, `"No"`, `"Timeout"`. Label every branch out of a decision.
- `dash`: `"dashed"` or `"dotted"` for optional, async or "later" paths.
- `route`: `"elbow"` (default, right angles round the shapes), `"straight"` or `"curved"`.
- `arrows`: `"end"` (default), `"both"` or `"none"`.

Connectors attach to the shapes' sides automatically and re-route when anything moves. Loops back up the chart go round the side.

## Errors

The board answers a bad draft with `status: "error"` and a `message` naming the path, like `draft.flowchart.connections[3].to: no step "pay"`. Fix that and send a new inbox document.
