// Each dimension is a way to group the scope items. Values are listed in the
// order their groups appear on the page. `quiet` values are the common case
// and are left off item tags to keep them readable.
export const dimensions = [
  {
    key: 'trade',
    label: 'Trade',
    values: [
      { key: 'demolition', label: 'Demolition & excavation' },
      { key: 'concrete', label: 'Concrete' },
      { key: 'framing', label: 'Framing & structural' },
      { key: 'masonry', label: 'Masonry & hardscape' },
      { key: 'plumbing', label: 'Plumbing & drainage' },
      { key: 'electrical', label: 'Electrical' },
      { key: 'hvac', label: 'HVAC' },
      { key: 'drywall', label: 'Insulation & drywall' },
      { key: 'windows', label: 'Windows & exterior doors' },
      { key: 'carpentry', label: 'Carpentry & millwork' },
      { key: 'tile', label: 'Tile' },
      { key: 'flooring', label: 'Flooring' },
    ],
  },
  {
    key: 'location',
    label: 'Location',
    values: [
      { key: 'throughout', label: 'Throughout basement' },
      { key: 'meter', label: 'Meter room / front entry' },
      { key: 'rec', label: 'Recreation room' },
      { key: 'fullBath', label: 'Full bath' },
      { key: 'halfBath', label: 'Half bath' },
      { key: 'bedroom', label: 'Bedroom' },
      { key: 'closets', label: 'Closet & storage' },
      { key: 'hallway', label: 'Hallway' },
      { key: 'laundry', label: 'Laundry area' },
      { key: 'family', label: 'Family room' },
      { key: 'kitchenette', label: 'Kitchenette' },
      { key: 'patio', label: 'Sunken patio / back of house' },
      { key: 'sideWalk', label: 'Side walkway & window wells' },
      { key: 'front', label: 'Front of house' },
      { key: 'outdoorUnits', label: 'Outdoor HVAC units' },
      { key: 'upBath', label: 'Upstairs bathroom' },
      { key: 'upBedroom', label: 'Upstairs bedroom' },
      { key: 'upHall', label: 'Upstairs hall' },
      { key: 'dining', label: 'Upstairs dining room' },
      { key: 'kitchen', label: 'Upstairs kitchen' },
      { key: 'tbd', label: 'Location to be confirmed' },
    ],
  },
  {
    key: 'phase',
    label: 'Phase',
    values: [
      { key: 'demo', label: '1 · Demolition & excavation' },
      { key: 'structure', label: '2 · Structure & below-slab' },
      { key: 'slab', label: '3 · Slab & subfloor' },
      { key: 'roughIn', label: '4 · Framing & rough-in' },
      { key: 'closeUp', label: '5 · Insulation & drywall' },
      { key: 'finish', label: '6 · Finishes & fixtures' },
    ],
  },
  {
    key: 'supply',
    label: 'Supplied by',
    values: [
      { key: 'contractor', label: 'Contractor supplies & installs', quiet: true },
      { key: 'owner', label: 'Owner supplies, contractor installs' },
      { key: 'ownerOnly', label: 'Owner handles' },
    ],
  },
  {
    key: 'area',
    label: 'Area',
    values: [
      { key: 'basement', label: 'Basement', quiet: true },
      { key: 'upstairs', label: 'Upstairs (non-basement)' },
    ],
  },
  {
    key: 'setting',
    label: 'Interior / exterior',
    values: [
      { key: 'interior', label: 'Interior', quiet: true },
      { key: 'exterior', label: 'Exterior' },
    ],
  },
];
