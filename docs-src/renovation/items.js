// Scope items from "Basement Renovation Plans". Wording follows the owner's
// list; items that appeared under more than one heading are merged. The
// original headings are not kept, so item text must carry any context (e.g.
// "ceiling") that trade and location don't.
//
// Every dimension value may be a single key or an array of keys (see
// dimensions.js). An item with several values appears in each of those groups.

const rsic = {
  href: 'https://pacinternationalllc.com/rsic-low-profile-wall-systems/',
  label: 'RSIC low-profile wall & ceiling systems',
};
const hudsonHeartPine = {
  href: 'https://uafloors.com/en/product/hudson-heart-pine',
  label: 'UA Floors Hudson Heart Pine',
};

const basement = { area: 'basement', setting: 'interior', supply: 'contractor' };
const exterior = { ...basement, setting: 'exterior' };
const upstairs = { ...basement, area: 'upstairs' };

const rawItems = [
  // Excavation
  { ...basement, trade: 'demolition', location: 'throughout', phase: 'demo',
    text: 'Remove existing concrete' },
  { ...basement, trade: 'demolition', location: 'throughout', phase: 'demo',
    text: 'Dig down enough so that the final floor-to-ceiling height is 7′0″ throughout the entire basement (after concrete, subfloor, flooring, ceiling panels and acoustic spacers)',
    note: 'Current concrete floor-to-joist height varies from 7′1″ at the front of the basement to 6′9″ at the back.' },
  { ...basement, trade: 'concrete', location: 'throughout', phase: 'slab',
    text: 'Pour concrete floors',
    note: 'Do not follow absolute level; follow a constant height from the joists above.' },
  { ...basement, trade: 'framing', location: 'throughout', phase: 'demo',
    text: 'Existing beam must be supported for the entire construction process' },
  { ...basement, trade: ['framing', 'concrete'], location: 'throughout', phase: 'structure',
    text: 'Extend beam supports as needed' },

  // Electric
  { ...basement, trade: 'electrical', location: 'meter', phase: 'roughIn',
    text: 'Add additional sub panel' },
  { ...basement, trade: 'electrical', location: 'throughout', phase: 'roughIn',
    text: 'Outlets' },
  { ...basement, trade: 'electrical', location: 'throughout', phase: 'roughIn',
    text: 'Overhead lights' },
  { ...basement, trade: 'electrical', location: 'throughout', phase: 'finish',
    text: 'Flush-mount ceiling lighting' },
  { ...basement, trade: 'electrical', location: 'tbd', phase: 'roughIn',
    text: 'Outlet on ceiling for projector' },
  { ...basement, trade: ['electrical', 'flooring'],
    location: ['fullBath', 'halfBath'], phase: 'roughIn',
    text: 'Electric radiant floor heating in both bathrooms' },

  // Sunken patio
  { ...exterior, trade: 'demolition', location: 'patio', phase: 'demo',
    text: 'Dig approximately 8′ × 10′, 3.5′ deep' },
  { ...exterior, trade: 'masonry', location: 'patio', phase: 'structure',
    text: 'Retaining wall — bricks, not concrete' },
  { ...exterior, trade: 'masonry', location: 'patio', phase: 'finish',
    text: 'Brick pavers' },
  { ...exterior, trade: 'plumbing', location: 'patio', phase: 'structure',
    text: 'Drain along low-profile bi-fold doors, attached to main drain' },

  // Side walkway & windows
  { ...exterior, trade: 'demolition', location: 'sideWalk', phase: 'demo',
    text: 'Dig two window wells to specifications' },
  { ...exterior, trade: 'plumbing', location: ['sideWalk', 'front'], phase: 'structure',
    text: 'Connect window well drainage to the storm drain at the front corner of the house by the porch' },
  { ...exterior, trade: ['concrete', 'masonry'], location: 'sideWalk', phase: 'finish',
    text: 'Replace walkway concrete and pavers after repairs',
    note: 'The side walkway is currently pavers over concrete.' },
  { ...basement, setting: ['interior', 'exterior'], trade: ['windows', 'masonry'], location: ['rec', 'bedroom'], phase: 'roughIn',
    text: 'Two enlarged windows to specifications' },
  { ...basement, trade: 'windows', location: 'family', phase: 'roughIn',
    text: 'Third window does not need adjustment' },

  // Back windows / doors
  { ...basement, setting: ['interior', 'exterior'], trade: 'windows', location: ['family', 'patio'], phase: 'roughIn',
    text: '8′ wide × 80″ tall bi-fold doors' },
  { ...basement, trade: 'framing', location: 'family', phase: 'structure',
    text: 'Install header above bi-fold doors to support' },

  // Plumbing
  { ...basement, trade: 'plumbing', location: 'hallway', phase: 'roughIn',
    text: 'Relocate water heater' },
  { ...basement, trade: 'plumbing', location: 'throughout', phase: 'roughIn',
    text: 'Reroute water lines' },
  { ...basement, trade: 'plumbing', location: 'throughout', phase: 'structure',
    text: 'Lower the drain pipes beneath the floor to leave enough clearance for the concrete pour',
    note: 'Probably no more than a few inches.' },
  { ...basement, trade: 'plumbing', location: 'throughout', phase: 'structure',
    text: 'All drains throughout the basement need a check valve' },
  { ...basement, trade: 'plumbing', location: 'meter', phase: 'structure',
    text: 'Drain in front entry room' },
  { ...basement, trade: 'plumbing', location: 'fullBath', phase: 'roughIn',
    text: 'Bathroom with shower, toilet and sink' },
  { ...basement, trade: 'plumbing', location: 'laundry', phase: 'roughIn',
    text: 'Supply and drain lines for laundry — LG WashTower (ventless)' },
  { ...basement, trade: 'plumbing', location: 'laundry', phase: 'roughIn',
    text: 'Utility sink, with supply and drain' },
  { ...basement, trade: 'plumbing', location: 'kitchenette', phase: 'roughIn',
    text: 'Bar sink, with supply and drain' },
  { ...basement, trade: 'plumbing', location: 'kitchenette', phase: 'roughIn',
    text: 'Fridge water hookup' },
  { ...exterior, trade: 'plumbing', location: 'front', phase: 'roughIn',
    text: 'Install exterior spigot in front of house' },
  { ...exterior, trade: 'plumbing', location: 'patio', phase: 'roughIn',
    text: 'Install exterior spigot in back of house' },

  // HVAC
  { ...exterior, trade: 'hvac', location: 'outdoorUnits', phase: 'roughIn',
    text: 'Install exterior unit' },
  { ...basement, trade: 'hvac', location: ['rec', 'bedroom', 'family'], phase: 'roughIn',
    text: 'Install three interior units' },
  { ...basement, trade: 'hvac', location: 'throughout', phase: 'roughIn',
    text: 'Connect 2nd floor unit to new line',
    note: 'The unit is installed but was left unconnected in the basement.' },
  { ...exterior, trade: 'hvac', location: 'outdoorUnits', phase: 'roughIn',
    text: 'Relocate left-most outdoor unit so the final configuration is 2 over 2',
    note: 'Currently 3 in a row.' },

  // Interior walls
  { ...basement, trade: 'framing', location: 'throughout', phase: 'roughIn',
    text: 'Build interior walls as per approved plans', link: rsic },
  { ...basement, trade: 'drywall', location: 'throughout', phase: 'closeUp',
    text: 'Sound-dampening insulation in all walls' },
  { ...basement, trade: 'drywall', location: ['rec', 'fullBath', 'halfBath'], phase: 'closeUp',
    text: 'Extra layer of purple board on wall between rec room and bathrooms' },
  { ...basement, trade: 'drywall', location: 'throughout', phase: 'closeUp',
    text: 'Moisture- and mold-resistant purple board on all walls' },

  // Ceiling
  { ...basement, trade: 'drywall', location: 'throughout', phase: 'closeUp',
    text: '6″ of ROCKWOOL Safe’n’Sound in the ceiling throughout' },
  { ...basement, trade: 'drywall', location: 'throughout', phase: 'closeUp',
    text: 'Ceiling: double layer of acoustically decoupled ⅝″ drywall', link: rsic },
  { ...basement, trade: ['framing', 'drywall'], location: 'throughout', phase: 'closeUp',
    text: 'Ceiling soffits where mechanicals run' },
  { ...basement, trade: 'drywall', location: 'throughout', phase: 'closeUp',
    text: '12″ beam in the ceiling can be exposed, not finished' },

  // Bathrooms
  { ...basement, trade: ['plumbing', 'tile'], location: 'fullBath', phase: 'roughIn',
    text: 'Zero-threshold shower' },
  { ...basement, supply: 'owner', trade: 'tile', location: 'fullBath', phase: 'finish',
    text: 'Shower tiling (if not a kit)' },
  { ...basement, supply: 'owner', trade: 'plumbing', location: ['fullBath', 'halfBath'], phase: 'finish',
    text: 'Toilets in both bathrooms' },
  { ...basement, supply: 'owner', trade: 'plumbing', location: ['fullBath', 'halfBath'], phase: 'finish',
    text: 'Sinks in both bathrooms' },
  { ...basement, trade: 'carpentry', location: ['fullBath', 'halfBath'], phase: 'roughIn',
    text: 'Grab bars with blocking' },
  { ...basement, trade: 'carpentry', location: ['fullBath', 'halfBath'], phase: 'roughIn',
    text: 'Medicine cabinet recess' },
  { ...basement, trade: ['tile', 'flooring'], location: ['fullBath', 'hallway'], phase: 'finish',
    text: 'Zero-height threshold from full bath to hallway — no raised sections' },
  { ...basement, trade: ['tile', 'flooring'], location: ['halfBath', 'bedroom'], phase: 'finish',
    text: 'Zero-height threshold from half bath to bedroom' },

  // Flooring
  { ...basement, trade: 'flooring', location: 'throughout', phase: 'slab',
    text: 'DRIcore or similar subfloor' },
  { ...basement, trade: 'flooring', location: ['rec', 'bedroom', 'closets', 'family', 'kitchenette'], phase: 'finish',
    text: 'Engineered reclaimed heart pine flooring', link: hudsonHeartPine },
  { ...basement, supply: 'owner', trade: 'tile', location: ['fullBath', 'halfBath'], phase: 'finish',
    text: 'Tile floors in bathrooms' },
  { ...basement, trade: 'tile', location: 'hallway', phase: 'finish',
    text: 'Tile floor in hallway' },

  // Doors, trim, kitchenette
  { ...basement, trade: 'carpentry', location: ['throughout', 'closets'], phase: 'finish',
    text: '9 solid wood, 5-panel doors',
    note: '5 passage, 3 closet, 1 sliding closet.' },
  { ...basement, supply: 'owner', trade: 'carpentry', location: 'throughout', phase: 'finish',
    text: 'Baseboard and cap moulding to match upstairs' },
  { ...basement, supply: 'owner', trade: 'carpentry', location: ['rec', 'bedroom', 'family'], phase: 'finish',
    text: 'Window trim to match upstairs windows' },
  { ...basement, trade: 'tile', location: 'kitchenette', phase: 'finish',
    text: 'Kitchenette backsplash' },

  // Non-basement
  { ...upstairs, trade: ['plumbing', 'tile'], location: 'upBath', phase: 'finish',
    text: 'Fix the shower/tub in the first-floor bathroom',
    note: 'Do this while the basement is still open, after the basement bathroom is finished.' },
  { ...upstairs, trade: 'demolition', location: 'upBedroom', phase: 'demo',
    text: 'Bedroom expansion: remove existing closet and laundry room',
    note: 'Existing flooring runs underneath the walls.' },
  { ...upstairs, trade: ['framing', 'carpentry'], location: 'upBedroom', phase: 'roughIn',
    text: 'Relocate bedroom door' },
  { ...upstairs, trade: ['framing', 'drywall'], location: ['upHall', 'dining'], phase: 'roughIn',
    text: 'Close up doorway between hall and dining room' },
  { ...upstairs, supply: 'owner', trade: 'carpentry', location: 'upBedroom', phase: 'finish',
    text: 'Install baseboard moulding in expanded bedroom' },
  { ...upstairs, supply: 'ownerOnly', trade: 'flooring', location: 'upBedroom', phase: 'finish',
    text: 'Bedroom floor refinishing' },
  { ...upstairs, setting: ['interior', 'exterior'], trade: 'windows', location: 'kitchen', phase: 'roughIn',
    text: 'Combine two windows into one large picture window',
    note: 'The window should open outward and up.' },
  { ...upstairs, trade: 'framing', location: 'kitchen', phase: 'structure',
    text: 'Install header above the area between the two existing windows' },
  { ...upstairs, trade: 'carpentry', location: 'kitchen', phase: 'finish',
    text: 'Replace moulding around window with new stock' },
  { ...upstairs, trade: 'electrical', location: 'dining', phase: 'roughIn',
    text: 'Move light switch in dining room' },
  { ...upstairs, trade: 'electrical', location: 'upBedroom', phase: 'roughIn',
    text: 'Move light switch in upstairs bedroom' },
];

const toList = value => (Array.isArray(value) ? value : [value]);

export const items = rawItems.map(({ text, note, link, ...tags }, index) => ({
  id: `item-${index + 1}`,
  text,
  note: note ?? null,
  link: link ?? null,
  tags: Object.fromEntries(Object.entries(tags).map(([key, value]) => [key, toList(value)])),
}));
