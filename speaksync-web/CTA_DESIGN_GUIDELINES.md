# SpeakSync Upgrade CTA Messages & Design Guidelines

## CTA Messages Catalog

### 1. General Upgrade CTA (Modal/Toast)
**Trigger**: When user attempts to access any premium feature
**Context**: General encouragement to upgrade

```typescript
{
  title: "Unlock Your Full Potential",
  description: "Take your presentations to the next level with Pro features designed for serious speakers and content creators.",
  buttonText: "Upgrade to Pro",
  secondaryButtonText: "See All Plans",
  benefits: [
    "Professional tools",
    "Unlimited content", 
    "AI assistance",
    "Analytics insights"
  ]
}
```

### 2. Script Limit Reached
**Trigger**: Free user attempts to create more than 1 script
**Context**: Storage limitation hit

```typescript
{
  title: "Script Limit Reached",
  description: "You've reached the maximum number of scripts for your free account. Upgrade to Pro to create unlimited scripts and unlock powerful features.",
  buttonText: "Upgrade to Pro",
  secondaryButtonText: "Manage Scripts",
  benefits: [
    "Unlimited scripts",
    "Cloud synchronization", 
    "AI-powered feedback",
    "Export to PDF"
  ]
}
```

### 3. Session Limit Reached
**Trigger**: Free user has used all monthly teleprompter sessions
**Context**: Usage frequency limitation

```typescript
{
  title: "Session Limit Reached", 
  description: "You've used all your free teleprompter sessions this month. Upgrade to continue practicing with unlimited sessions.",
  buttonText: "Upgrade Now",
  secondaryButtonText: "Wait Until Reset",
  benefits: [
    "Unlimited practice sessions",
    "Extended session duration",
    "Performance analytics", 
    "Speech analysis"
  ]
}
```

### 4. Time Limit Reached
**Trigger**: Free user exceeds 3-minute session duration
**Context**: Time-based limitation during active use

```typescript
{
  title: "Time Limit Reached",
  description: "Your free session time is up! Upgrade to Pro for unlimited session duration and advanced features.",
  buttonText: "Upgrade to Pro", 
  secondaryButtonText: "End Session",
  benefits: [
    "Unlimited session time",
    "Auto-save progress",
    "Advanced controls",
    "Performance tracking"
  ]
}
```

### 5. Feature Locked
**Trigger**: User clicks on any premium feature (AI feedback, analytics, etc.)
**Context**: Specific feature access attempt

```typescript
{
  title: "Premium Feature",
  description: "This feature is available with Pro and Studio plans. Upgrade to unlock advanced tools and boost your presentation skills.",
  buttonText: "Upgrade Now",
  secondaryButtonText: "Learn More", 
  benefits: [
    "AI feedback and suggestions",
    "Advanced analytics",
    "Export capabilities",
    "Team collaboration"
  ]
}
```

### 6. Trial Ending Soon
**Trigger**: User's trial period approaching expiration
**Context**: Retention-focused messaging

```typescript
{
  title: "Trial Ending Soon",
  description: "Your free trial ends in a few days. Upgrade now to keep all your premium features and continue improving your presentations.",
  buttonText: "Upgrade Now",
  secondaryButtonText: "Remind Me Later",
  benefits: [
    "Keep all premium features",
    "Unlimited everything", 
    "Priority support",
    "Advanced tools"
  ]
}
```

## Design Guidelines

### Visual Hierarchy
1. **Primary Action**: Always blue (#3B82F6) with high contrast
2. **Secondary Action**: Gray (#6B7280) with subtle styling
3. **Destructive Actions**: Red (#EF4444) when appropriate
4. **Success States**: Green (#10B981) for confirmations

### Layout Principles

#### Modals
```css
.upgrade-modal {
  max-width: 400px;
  padding: 24px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

#### Toasts
```css
.upgrade-toast {
  max-width: 360px;
  padding: 16px;
  border-radius: 12px;
  background: white;
  border: 1px solid #E5E7EB;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

#### Inline Prompts
```css
.inline-upgrade {
  padding: 16px;
  border-radius: 8px;
  background: linear-gradient(to right, #EFF6FF, #F3E8FF);
  border: 1px solid #DBEAFE;
}
```

### Typography Scale

#### Headlines
- **Modal Title**: 18px, font-weight: 600 (font-semibold)
- **Toast Title**: 14px, font-weight: 600 (font-semibold) 
- **Inline Title**: 14px, font-weight: 600 (font-semibold)

#### Body Text
- **Description**: 14px, font-weight: 400, color: #6B7280
- **Benefits**: 13px, font-weight: 400, color: #6B7280

#### Actions
- **Primary Button**: 14px, font-weight: 600
- **Secondary Button**: 14px, font-weight: 500

### Color Palette

#### Primary Colors
- **Blue 600**: #2563EB (Primary actions)
- **Blue 100**: #DBEAFE (Backgrounds)
- **Blue 50**: #EFF6FF (Light backgrounds)

#### Semantic Colors
- **Green 500**: #10B981 (Success, checkmarks)
- **Red 500**: #EF4444 (Warnings, limits)
- **Yellow 500**: #F59E0B (Alerts, near-limits)
- **Purple 500**: #8B5CF6 (Premium features)

#### Neutral Colors
- **Gray 900**: #111827 (Primary text)
- **Gray 600**: #6B7280 (Secondary text)
- **Gray 400**: #9CA3AF (Disabled states)
- **Gray 100**: #F3F4F6 (Backgrounds)

### Iconography

#### Feature Icons
- **Lock**: `<LockClosedIcon />` for locked features
- **Sparkles**: `<SparklesIcon />` for premium features
- **Star**: `<StarIcon />` for popular plans
- **Bolt**: `<BoltIcon />` for performance features
- **Check**: `<CheckIcon />` for included benefits

#### Sizing
- **Modal Icons**: 24px (w-6 h-6)
- **Toast Icons**: 20px (w-5 h-5)
- **Button Icons**: 16px (w-4 h-4)
- **Feature Icons**: 20px (w-5 h-5)

### Animation Guidelines

#### Entrance Animations
```css
/* Modal entrance */
.modal-enter {
  opacity: 0;
  transform: scale(0.95);
  transition: all 300ms ease-out;
}

.modal-enter-active {
  opacity: 1;
  transform: scale(1);
}

/* Toast slide-in */
.toast-enter {
  opacity: 0;
  transform: translateX(100%);
  transition: all 250ms ease-out;
}

.toast-enter-active {
  opacity: 1;
  transform: translateX(0);
}
```

#### Hover States
```css
.upgrade-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transition: all 150ms ease-out;
}
```

### Accessibility Requirements

#### WCAG 2.1 AA Compliance
1. **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
2. **Focus Indicators**: Visible focus rings on all interactive elements
3. **Screen Reader Support**: Proper ARIA labels and roles
4. **Keyboard Navigation**: Full keyboard accessibility

#### Implementation
```tsx
// Focus management
const upgradeButtonRef = useRef<HTMLButtonElement>(null);

useEffect(() => {
  if (isOpen) {
    upgradeButtonRef.current?.focus();
  }
}, [isOpen]);

// ARIA attributes
<button
  ref={upgradeButtonRef}
  aria-describedby="upgrade-description"
  aria-label="Upgrade to Pro plan"
>
  Upgrade Now
</button>
```

### Responsive Design

#### Breakpoints
- **Mobile**: 0-640px (sm)
- **Tablet**: 641-1024px (md) 
- **Desktop**: 1025px+ (lg)

#### Mobile Optimizations
```css
@media (max-width: 640px) {
  .upgrade-modal {
    margin: 16px;
    max-width: calc(100vw - 32px);
  }
  
  .upgrade-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .upgrade-button {
    width: 100%;
    padding: 12px 16px;
  }
}
```

### Content Guidelines

#### Tone & Voice
- **Benefit-Oriented**: Focus on what users gain, not what they lack
- **Encouraging**: Positive language that motivates upgrade
- **Clear & Concise**: Avoid jargon, use simple language
- **Action-Oriented**: Strong verbs and clear CTAs

#### Writing Rules
1. **Headlines**: Maximum 5 words when possible
2. **Descriptions**: 1-2 sentences, under 140 characters
3. **Benefits**: Start with verbs (Get, Unlock, Access, Create)
4. **Buttons**: Action verbs (Upgrade, Unlock, Get Started)

#### Localization Considerations
- **Text Length**: Leave 30% extra space for translations
- **Cultural Sensitivity**: Avoid region-specific references
- **Currency**: Support multiple currencies and formats
- **Right-to-Left**: Consider RTL language support

### Implementation Checklist

#### Development
- [ ] All CTAs use consistent color palette
- [ ] Proper TypeScript types for all components
- [ ] Error boundaries around upgrade flows
- [ ] Loading states for payment processing
- [ ] Analytics tracking for conversion funnels

#### Testing
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness on various screen sizes
- [ ] Accessibility testing with screen readers
- [ ] Keyboard navigation testing
- [ ] Performance testing for large datasets

#### Monitoring
- [ ] Conversion rate tracking by CTA type
- [ ] A/B testing framework for message optimization
- [ ] Error rate monitoring for payment flows
- [ ] User feedback collection on upgrade experience

This comprehensive guide ensures consistent, accessible, and conversion-optimized upgrade experiences across the SpeakSync platform.
