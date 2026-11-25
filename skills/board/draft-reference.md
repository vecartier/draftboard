# Draftboard draft format

A draft is JSON: { "frames": [Frame], "flows"?: [{ "from": frameName, "to": frameName }] }.

Frame: { "name", "device"?: "iphone-17-pro" (default) | other device id | "custom" (then "width", "height"),
  "x"?, "y"? (canvas position; default: to the right of existing content), "padding"?: 20, "gap"?: 12, "children": [Node] }
Children stack top to bottom from just under the system bar, inside the padding.

Node (all coordinates relative to the frame; every node also takes the layout keys below):
- { "type": "text", "text", "style"?: "title"|"heading"|"body"|"caption", "size"?, "bold"?, "font"?: "system"|"rounded"|"serif"|"mono"|"handwritten", "color"?: "#rrggbb" }
- { "type": "component", "component": button|navigationBar|tabBar|listRow|toggle|textField|searchBar|segmentedControl|slider|card|imagePlaceholder,
    "label"? (segmentedControl: "A, B, C"), "fill"?, "color"? (foreground) }  navigationBar and tabBar span the full width; tabBar pins to the bottom.
- { "type": "wireframe", "id" } a grey sketch block from the library (see the reference for ids, e.g. hero, listRow, card, form, emptyState)
- { "type": "rect"|"ellipse", "fill"?, "stroke"?, "radius"? }
- { "type": "line" } a hairline divider
- { "type": "icon", "name"?: Lucide name like "house" or "chevron-right" (omit for a placeholder), "size"?: 24, "color"? }
- { "type": "image" } an image placeholder (default full width, 0.6 aspect)
- { "type": "spacer", "height" }
- { "type": "row", "children": [Node], "gap"?: 8, "justify"?: "start"|"center"|"end"|"spaceBetween" } lays children left to right, centred vertically.
Layout keys: "width"?: number | "fill", "height"?, "align"?: "leading"|"center"|"trailing", "gapAfter"?,
  "bleed"?: true (ignore padding, full width), "pin"?: "top"|"bottom", "x"?/"y"? (absolute inside the frame; y skips the stack).

Keep it a wireframe: real labels and copy, few colours, one idea per screen. Use flows for navigation between frames.

## Catalog

### devices
- {"id": "iphone-18-pro", "name": "iPhone 18 Pro", "width": 402, "height": 874, "topInset": 62}
- {"id": "iphone-18-pro-max", "name": "iPhone 18 Pro Max", "width": 440, "height": 956, "topInset": 62}
- {"id": "iphone-duo-folded", "name": "iPhone Duo (folded)", "width": 466, "height": 678, "topInset": 62}
- {"id": "iphone-duo-open", "name": "iPhone Duo (open)", "width": 669, "height": 951, "topInset": 62}
- {"id": "iphone-17-pro", "name": "iPhone 17 Pro", "width": 402, "height": 874, "topInset": 62}
- {"id": "iphone-17", "name": "iPhone 17", "width": 402, "height": 874, "topInset": 62}
- {"id": "iphone-17-pro-max", "name": "iPhone 17 Pro Max", "width": 440, "height": 956, "topInset": 62}
- {"id": "iphone-air", "name": "iPhone Air", "width": 420, "height": 912, "topInset": 62}
- {"id": "iphone-se", "name": "iPhone SE", "width": 375, "height": 667, "topInset": 20}
- {"id": "android-large", "name": "Android Large", "width": 412, "height": 915, "topInset": 36}
- {"id": "android-compact", "name": "Android Compact", "width": 360, "height": 800, "topInset": 32}
- {"id": "ipad-mini", "name": "iPad mini", "width": 744, "height": 1133, "topInset": 24}
- {"id": "ipad-air-11", "name": "iPad Air 11\"", "width": 820, "height": 1180, "topInset": 24}
- {"id": "ipad-pro-11", "name": "iPad Pro 11\"", "width": 834, "height": 1210, "topInset": 24}
- {"id": "ipad-pro-13", "name": "iPad Pro 13\"", "width": 1032, "height": 1376, "topInset": 24}
- {"id": "android-tablet", "name": "Android Tablet", "width": 800, "height": 1280, "topInset": 24}
- {"id": "macbook-air-13", "name": "MacBook Air 13\"", "width": 1470, "height": 956, "topInset": 32}
- {"id": "macbook-pro-14", "name": "MacBook Pro 14\"", "width": 1512, "height": 982, "topInset": 32}
- {"id": "macbook-pro-16", "name": "MacBook Pro 16\"", "width": 1728, "height": 1117, "topInset": 32}
- {"id": "laptop-hd", "name": "Laptop 1366×768", "width": 1366, "height": 768, "topInset": 0}
- {"id": "desktop-1080", "name": "Desktop 1920×1080", "width": 1920, "height": 1080, "topInset": 0}
- {"id": "browser", "name": "Browser", "width": 1440, "height": 900, "topInset": 44}
- {"id": "mac-window", "name": "Mac Window", "width": 1280, "height": 800, "topInset": 52}
- {"id": "watch-46", "name": "Apple Watch 46mm", "width": 208, "height": 248, "topInset": 0}
- {"id": "watch-42", "name": "Apple Watch 42mm", "width": 187, "height": 223, "topInset": 0}
- {"id": "watch-ultra", "name": "Apple Watch Ultra", "width": 205, "height": 251, "topInset": 0}
- {"id": "carplay", "name": "CarPlay", "width": 800, "height": 480, "topInset": 0}
- {"id": "carplay-wide", "name": "CarPlay Widescreen", "width": 1920, "height": 720, "topInset": 0}
- {"id": "car-portrait", "name": "Car Portrait Screen", "width": 768, "height": 1024, "topInset": 0}
- {"id": "tv-1080", "name": "TV 1080p", "width": 1920, "height": 1080, "topInset": 0}
- {"id": "custom", "name": "Custom frame (give width and height)"}

### components
- {"kind": "button", "title": "Button", "width": 200, "height": 48, "defaultLabel": "Continue"}
- {"kind": "navigationBar", "title": "Navigation Bar", "width": 402, "height": 52, "defaultLabel": "Title"}
- {"kind": "tabBar", "title": "Tab Bar", "width": 402, "height": 84, "defaultLabel": ""}
- {"kind": "listRow", "title": "List Row", "width": 370, "height": 48, "defaultLabel": "List item"}
- {"kind": "toggle", "title": "Toggle", "width": 52, "height": 32, "defaultLabel": ""}
- {"kind": "textField", "title": "Text Field", "width": 340, "height": 44, "defaultLabel": "Placeholder"}
- {"kind": "searchBar", "title": "Search Bar", "width": 370, "height": 36, "defaultLabel": "Search"}
- {"kind": "segmentedControl", "title": "Segmented Control", "width": 300, "height": 32, "defaultLabel": "First, Second, Third"}
- {"kind": "slider", "title": "Slider", "width": 280, "height": 28, "defaultLabel": ""}
- {"kind": "card", "title": "Card", "width": 300, "height": 240, "defaultLabel": "Card title"}
- {"kind": "imagePlaceholder", "title": "Image", "width": 200, "height": 152, "defaultLabel": ""}

### wireframes
- {"category": "Common", "items": [{"id": "button", "title": "Button", "width": 200, "height": 48}, {"id": "secondaryButton", "title": "Secondary Button", "width": 200, "height": 48}, {"id": "iconButton", "title": "Icon Button", "width": 44, "height": 44}, {"id": "textField", "title": "Text Field", "width": 340, "height": 70}, {"id": "textArea", "title": "Text Area", "width": 340, "height": 120}, {"id": "dropdown", "title": "Dropdown", "width": 240, "height": 44}, {"id": "checkbox", "title": "Checkbox", "width": 200, "height": 24}, {"id": "radio", "title": "Radio Button", "width": 200, "height": 24}, {"id": "toggle", "title": "Toggle", "width": 52, "height": 32}, {"id": "slider", "title": "Slider", "width": 280, "height": 28}, {"id": "stepper", "title": "Stepper", "width": 100, "height": 32}, {"id": "progress", "title": "Progress Bar", "width": 280, "height": 8}, {"id": "segmentedControl", "title": "Segmented Control", "width": 300, "height": 32}, {"id": "chips", "title": "Chips", "width": 260, "height": 32}, {"id": "badge", "title": "Badge", "width": 64, "height": 24}, {"id": "avatar", "title": "Avatar", "width": 48, "height": 48}, {"id": "card", "title": "Card", "width": 300, "height": 240}, {"id": "imagePlaceholder", "title": "Image", "width": 200, "height": 152}, {"id": "divider", "title": "Divider", "width": 320, "height": 1}, {"id": "paragraph", "title": "Paragraph", "width": 320, "height": 64}]}
- {"category": "Mobile", "items": [{"id": "statusBar", "title": "Status Bar", "width": 402, "height": 54}, {"id": "navigationBar", "title": "Navigation Bar", "width": 402, "height": 52}, {"id": "largeTitle", "title": "Large Title", "width": 402, "height": 96}, {"id": "searchBar", "title": "Search Bar", "width": 370, "height": 36}, {"id": "tabBar", "title": "Tab Bar", "width": 402, "height": 84}, {"id": "toolbar", "title": "Toolbar", "width": 402, "height": 50}, {"id": "listRow", "title": "List Row", "width": 370, "height": 48}, {"id": "subtitleRow", "title": "Row with Subtitle", "width": 370, "height": 64}, {"id": "toggleRow", "title": "Toggle Row", "width": 370, "height": 48}, {"id": "sectionHeader", "title": "Section Header", "width": 370, "height": 32}, {"id": "banner", "title": "Notification", "width": 370, "height": 76}, {"id": "alert", "title": "Alert", "width": 270, "height": 150}, {"id": "actionSheet", "title": "Action Sheet", "width": 370, "height": 236}, {"id": "bottomSheet", "title": "Bottom Sheet", "width": 402, "height": 320}, {"id": "emptyState", "title": "Empty State", "width": 300, "height": 220}, {"id": "pageDots", "title": "Page Dots", "width": 64, "height": 8}, {"id": "fab", "title": "Floating Button", "width": 56, "height": 56}, {"id": "carousel", "title": "Carousel", "width": 402, "height": 200}, {"id": "keyboard", "title": "Keyboard", "width": 402, "height": 290}, {"id": "onboarding", "title": "Onboarding Page", "width": 340, "height": 420}]}
- {"category": "Web", "items": [{"id": "topNav", "title": "Top Navigation", "width": 1200, "height": 64}, {"id": "sidebar", "title": "Sidebar", "width": 240, "height": 520}, {"id": "hero", "title": "Hero Section", "width": 1200, "height": 480}, {"id": "featureGrid", "title": "Feature Grid", "width": 1080, "height": 200}, {"id": "footer", "title": "Footer", "width": 1200, "height": 180}, {"id": "table", "title": "Data Table", "width": 720, "height": 200}, {"id": "tabs", "title": "Tabs", "width": 480, "height": 44}, {"id": "breadcrumbs", "title": "Breadcrumbs", "width": 320, "height": 24}, {"id": "pagination", "title": "Pagination", "width": 300, "height": 36}, {"id": "modal", "title": "Modal Dialog", "width": 480, "height": 260}, {"id": "form", "title": "Sign-in Form", "width": 360, "height": 300}, {"id": "pricingCard", "title": "Pricing Card", "width": 300, "height": 380}, {"id": "statCard", "title": "Stat Card", "width": 240, "height": 120}, {"id": "tooltip", "title": "Tooltip", "width": 160, "height": 40}, {"id": "accordion", "title": "Accordion", "width": 480, "height": 160}]}

### textStyles
- {"style": "title", "fontSize": 34, "bold": true}
- {"style": "heading", "fontSize": 22, "bold": true}
- {"style": "body", "fontSize": 17, "bold": false}
- {"style": "caption", "fontSize": 13, "bold": false}

### icons
"Any Lucide icon name, PascalCase or kebab-case (e.g. \"house\", \"chevron-right\", \"ShoppingCart\"). Omit name for a generic icon placeholder."
