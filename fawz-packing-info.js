(function () {
  'use strict';

  // Display-only catalogue notes. No prices, quantities or cart data are changed.
  function resolve(c) {
    const title = String(c.title || '').toLowerCase();
    const choice = String(c.choice || '').toLowerCase();
    const id = String(c.id || '').toLowerCase();
    const text = [title, choice, id].join(' ');
    const note = (pack, green = false) => ({ pack, green });
    const cards = n => `${n}s (cards per box)`;

    switch (c.page) {
      case 'plasticFastners.html':
        return note('100s', true);

      case 'patternPaper.html':
        return note(/80\s*gsm/.test(text) ? '50-metre rolls' : '25-metre rolls');

      case 'nylonLace.html':
        return note('100-yard rolls');

      case 'bonning.html':
        if (title === 'polyester boning') return note('46-metre rolls');
        if (title === 'clear plastic boning') return note('35-metre rolls');
        if (title === 'coat liners' || title === 'sleeve / shoulder roll') return note('10s (pairs per pack)');
        if (['bra cups', 'under wire', 'shoulder pads', 'mens shoulder pads'].includes(title)) return note('1s (single)');
        return null;

      case 'beads.html':
        if (title === 'pearl beads') return note(/\b4mm\b/.test(choice) ? '400g packs' : '250g packs', true);
        if (title === 'opaque glass beads') return note('20g packs');
        return note('1s (single)');

      case 'bridal.html':
        return note(title === 'bridal gloves' ? '1s (one pair)' : '1s (single)');

      case 'broach.html':
        return note('1s (single)');

      case 'sizwLabels.html':
        if (title === 'woven size labels') return note('250 labels per roll', true);
        if (title === 'plastic size tabs') return note('6 sets per card, 12 cards per box', true);
        return note('1s (single)', true);

      case 'buttons.html':
        if (/shirt buttons|fisheye buttons|aluminium with plastic/.test(title) && !/golf/.test(title)) return note('1,000s', true);
        if (title === 'workwear buttons') return note('200s', true);
        if (title === 'self cover buttons') return note('100s (sets per box)', true);
        if (title === 'blazer buttons') return note('50s, 100s or 200s');
        if (['golf shirt buttons', 'triangle buttons', 'cover button moulds', 'tools'].includes(title)) return note('1s (single)', true);
        if (title === 'denim buttons') return {
          text: 'Packed in 50s (cube), or 6s (retail pack; 10 packs per box). Loose: price per unit, packed in 100s, 200s, 500s or 1,000s.'
        };
        return null;

      case 'interlining.html':
        if (title === 'non-woven interlining') {
          if (/100 yards/.test(choice)) return note('100-yard rolls');
          if (/25 yards/.test(choice)) return note('25-yard rolls');
          return null;
        }
        if (title === 'tracing material') return note('25-yard rolls');
        if (title === 'water-soluble interlining') return note('100-yard rolls');
        if (title === 'pp embroidery') return note('50-yard rolls', true);
        if (title === 'spider interlining') return note('50-yard rolls');
        if (title === 'stf interlining') return note('25-metre rolls', true);
        if (title === 'microdot') return note('100-metre rolls');
        if (title === 'dimension interlining') return note('25-metre rolls', true);
        if (title === 'collar fusing (quala)') return note(/premium|jpsa/.test(choice) ? '10-metre rolls' : '25-metre rolls', true);
        if (title === 'red line interlining') return note('50-metre rolls', true);
        if (title === 'jacket lining') return {text: 'Price per yard'};
        if (title === 'bukram') return {text: 'Price per metre, packed in full rolls (1.5m wide × 50m long)'};
        if (title === 'applique paper') return {text: 'Price per roll, packed in 100-metre rolls (100cm wide)'};
        return null;

      case 'elastics.html':
        if (title === 'shirring elastic') return note(/carded/.test(choice) ? cards(12) : '36s (rolls per box)', true);
        if (title === 'hat elastics') return note(/carded/.test(choice) ? cards(20) : '200-metre rolls', true);
        if (title === 'cord elastics') return note('20s (cards per box; 2.75 metres per card)', true);
        if (title === 'braided elastic') return note('100-metre rolls', true);
        if (title === 'buttonhole elastics') return note('30-metre rolls', true);
        if (['elastics', 'color elastics normal', 'non-curl elastic', 'drawcord elastics', 'printed elastic'].includes(title)) return note('25-metre rolls', true);
        // No roll length is given for shock cord.
        return null;

      case 'hookAndLoop.html':
        if (/dots/.test(title)) {
          const match = choice.match(/\((18|12|10|8)s\)/);
          return match ? note(`${match[1]}s (pairs per card), 12 cards per box`) : null;
        }
        return note('25 pair-metre rolls');

      case 'trimmings.html':
        if (title === 'ethnic tape') return note('25-metre rolls', true);
        if (title === 'bias binding') return note('25-yard rolls');
        if (title === 'satin bias binding') return note('100-yard rolls');
        if (title === 'hem tape') {
          return note(/double sided/.test(choice) ? '50-metre rolls' : '65-yard rolls');
        }
        return null;

      case 'machineAccessories.html': {
        if (c.category === 'Machine Parts') return note('10s', true);
        if (title === 'machine oils') {
          if (/500ml/.test(text)) return note('25s', true);
          if (/5 litre|5l\b/.test(text)) return note('1s (single)', true);
          if (/1 litre|1l\b/.test(text)) return note('15s', true);
          if (/100ml/.test(text)) return note('12s', true);
          return null;
        }
        const carded = /carded/.test(choice);
        if (title === 'belts') return note(carded ? cards(10) : '20s', !carded);
        if (title === 'all bobbins') {
          if (/singer clear|pfaff|embroidery|husqvarna/.test(choice)) return note(cards(6), true);
          if (carded) return note(cards(12), true);
          return note(/plastic|10-hole/.test(choice) ? '200s' : '100s', true);
        }
        if (title === 'all bobbin cases') {
          return note(carded ? cards(10) : '50s', true);
        }
        if (title === 'bobbin clamps') return note('1 per card, 10 cards per box', true);
        if (title === 'bobbin buddies') return note('20s (pieces per plastic box)', true);
        if (title === 'globes') {
          if (carded) return note(cards(10), true);
          return note('50s', true);
        }
        return null;
      }

      case 'needles.html': {
        if (/singer machine oil/.test(title)) return note('12s', true); // User's 100ml oil rule.
        if (/butterfly|violin/.test(title)) return note('500s (needles per box; 50 packets)');
        if (/gemsy/.test(title)) return note('10 needles per card, 100 needles per box, 1,000 needles per brick', true);
        const hand = {
          'darner 5/10': 20, 'wool needles': 24, 'beading 10/13': 20,
          'easy threading 4/8': 20, 'household assorted': 20, "sharp's 5/10": 20,
          'chenille 18/24': 20, 'embroidery': 20, 'tapestry 18/24': 20,
          'gold eye needle compacts': 12, 'army & navy': 36, 'happy needles': 36,
          'rnp27': 36, 'packing needles': 24, 'circular needles': 24,
          'upholstery straight needles': 12, 'upholstery curved needles': 12
        };
        if (hand[title]) return note(cards(hand[title]));
        const machine = {
          'overlocker': 20, 'embroidery machine needles': 10, 'universal': 20,
          'ball point (jersey)': 10, 'top stitch': 20, 'microtex': 10,
          'industrial dbx1': 20, 'twin needles': 10, 'stretch': 10,
          'leather': 10, 'jeans (denim)': 20, 'quilting': 20
        };
        if (machine[title]) return note(cards(machine[title]), title === 'industrial dbx1');
        return null;
      }

      case 'allPins.html':
        if (/quilting pins 45mm/.test(title)) return note('20 tubs per box');
        if (/glass & crystal head pins/.test(title)) return note('12 tubs per box');
        if (/glass & pearl head pins/.test(title)) {
          return note(/pearl/.test(choice) ? '50 pins per plastic box, 12 boxes per pack' : '12 tubs per box');
        }
        if (/diamond head pins/.test(title)) return note('12 tubs per box');
        if (/^berry pins/.test(title)) return note(/carded/.test(choice) ? '12 cards per box' : '36 per box');
        if (title === 'hat pins - small') return note('36 cards per box');
        if (title === 'hat pins - large') return note('24 cards per box');
        return null;

      case 'sewingNotions.html': {
        if (/hook & eyes - single pack/.test(title)) return note(cards(24));
        if (/trouser hook & bar - single/.test(title)) return note('3 sets per card, 24 cards per box');
        if (/trouser hook & bar - bulk/.test(title)) return note('144s (sets per box)');
        if (/hook & eyes - bulk/.test(title)) return note('bulk packs');
        if (title === 'fabric glue') return note('10s (per box)', true);
        if (title === 'white craft glue') return note('6s (per pack)', true);
        if (title === 'glitter glue') return note('12s');
        if (title === 'glue gun') return note('1s (single card)', true);
        if (/^waistcoat buckle/.test(title)) return null;
        if (title === 'buckle silver') return note('2s (per retail pack), 10 packs per box');
        if (/clear glue sticks|glitter glue sticks/.test(title)) {
          const match = choice.match(/\b(5|8) pack\b/);
          return match ? note(`${match[1]}s (sticks per card), 6 cards per box`, true) : null;
        }
        if (title === 'kearing permanent fabric markers') {
          if (/12 pack/.test(choice)) return note('12s', true);
          if (/6 pack/.test(choice)) return note('6s');
          if (/24 pack/.test(choice)) return note('24s');
          return null;
        }
        if (title === 'kearing non-permanent fabric markers') {
          const count = choice.match(/\b(6|12) pack\b/);
          return count ? note(`${count[1]}s`) : null;
        }
        if (title === 'erasable fabric marker' || title === 'assorted colour pack' || title === 'eraser pen') return note('12s (per box)');
        if (title === 'auto disappear fabric marker') return note(cards(12), true);
        if (title === 'water erasable fabric marker') return note(cards(12));
        if (title === 'water erasable pen bulk pack') return note('12s');
        if (title === 'dressmaker pencils') return note(cards(12));
        // Colour/form must be explicit for these additional marker descriptions.
        if (/marker|pencil/.test(title) && /violet|pink|\bpermanent\b/.test(text) && !/non-permanent/.test(text)) {
          if (/12/.test(text)) return note(/carded/.test(text) ? cards(12) : '12s', true);
        }
        if (/pencils/.test(title) && /loose/.test(text)) return note('12s', true);
        if (/hotfix applicator|double head hotfix pen/.test(title)) return note('1s (single blister pack)');
        if (/hotfix|hot fix/.test(title)) {
          if (/chain/.test(title)) return note('10-yard rolls');
          return null;
        }
        return null;
      }
      default:
        return null;
    }
  }

  function displayText(result) {
    return result ? result.text || `${result.green ? 'Price per unit, packed in ' : 'Packed in '}${result.pack}` : '';
  }

  function update() {
    const block = document.getElementById('fawzPackingInfo');
    if (!block) return;
    const modal = block.closest('.modal');
    const selections = Array.from(modal.querySelectorAll('select'))
      .filter(select => select.getClientRects().length)
      .map(select => select.options[select.selectedIndex]?.textContent || '');
    let product = null;
    let group = null;
    if (typeof selectedProduct !== 'undefined') product = selectedProduct;
    if (typeof currentProduct !== 'undefined') product = currentProduct || product;
    if (typeof currentGroup !== 'undefined') group = currentGroup;
    if (typeof selectedGroup !== 'undefined') group = selectedGroup || group;
    if (typeof currentCategory !== 'undefined') group = currentCategory || group;
    if (typeof activeGroup !== 'undefined') group = activeGroup || group;
    if (typeof activeItem !== 'undefined') group = activeItem || group;
    const context = {
      page: decodeURIComponent(location.pathname.split('/').pop()),
      title: document.getElementById('modalTitle')?.textContent.trim() || '',
      choice: selections.join(' | '),
      id: product?.productId || window.fawzCurrentProductId || '',
      category: group?.category || product?.category || ''
    };
    const text = displayText(resolve(context));
    if (block.textContent !== text) block.textContent = text;
    if (block.hidden !== !text) block.hidden = !text;
  }

  // Available to validation tools; has no effect on shopping behavior.
  window.FawzPackingInfo = { resolve, displayText, refresh: update };
  const block = document.getElementById('fawzPackingInfo');
  if (!block) return;
  new MutationObserver(update).observe(block.closest('.modal'), {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['style', 'class', 'src']
  });
  document.addEventListener('change', () => queueMicrotask(update));
  document.addEventListener('click', () => queueMicrotask(update));
  update();
})();
