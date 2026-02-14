# QueueTicket Component

A React component for displaying queue tickets with role-based actions (print for staff, save as image for clients).

## Installation

Install the required dependency:

```bash
npm install html2canvas
```

## Usage

```jsx
import QueueTicket from "./components/QueueTicket/QueueTicket";

function App() {
  return (
    <QueueTicket
      queueNumber="WATE-001"
      department="Waterworks Department"
      dateTime={new Date().toLocaleString()}
    />
  );
}
```

## Props

| Prop          | Type   | Required | Description                            |
| ------------- | ------ | -------- | -------------------------------------- |
| `queueNumber` | string | Yes      | The queue number to display            |
| `department`  | string | Yes      | The department name                    |
| `dateTime`    | string | Yes      | The date and time of ticket generation |

## Role-Based Behavior

The component checks `localStorage.getItem('role')` to determine which button to show:

- **Staff role**: Shows "Print Ticket" button that triggers `window.print()`
- **Client role**: Shows "Save Ticket" button that downloads the ticket as PNG image

## Features

- ✅ Role-based button visibility
- ✅ High-quality image export (2x scale)
- ✅ Mobile-friendly responsive design
- ✅ Print-optimized styles
- ✅ Loading state for save operation
- ✅ Beautiful gradient design
- ✅ Accessibility support

## File Structure

```
src/components/QueueTicket/
├── QueueTicket.jsx    # Main component
├── QueueTicket.css    # Styles
└── README.md          # Documentation
```

## Example Integration

```jsx
// Example: Using in a modal after queue creation
import { useState } from "react";
import QueueTicket from "./components/QueueTicket/QueueTicket";

function QueueModal({ queueData, onClose }) {
  return (
    <div className="modal">
      <QueueTicket
        queueNumber={queueData.number}
        department={queueData.department}
        dateTime={queueData.createdAt}
      />
      <button onClick={onClose}>Close</button>
    </div>
  );
}
```

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled

## Notes

- The ticket element must have `id="ticket"` for html2canvas to work
- Image quality is set to 2x scale for better clarity
- The component handles loading states during image generation
- Print styles hide the action buttons automatically
