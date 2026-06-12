// All hub dialogue. Content only — dialog-box mechanics live in
// ui/dialog.js, quest/gold mutations go through the systems.
//
// Tone rules apply: every named character has a bit, a catchphrase, and
// one wrong belief they will defend forever.

import { startHunt, claimReward } from '../systems/quest.js';
import { hespethLine } from './hespeth.js';
import { grantBackstory } from '../systems/credentials.js';
import { addMenace } from '../core/meta.js';
import { ledgerize } from '../systems/ledger.js';
import { canBorrow, borrow, payDown, aprFor, tierName, creditLimit, minPayment, truthInLending } from '../systems/credit.js';

const pct = apr => (apr * 100).toFixed(2) + '%';

/** The decline letters. Each reason gets the dignity of specificity. */
function declineText(reason, meta) {
  if (reason === 'no income') return 'DECLINED: NO VERIFIABLE INCOME. The Guild pays bounties. Geese are out there. Geese are income.';
  if (reason === 'delinquent') return 'Your file has a sticker on it. The sticker is red. I\'m sorry.';
  if (reason === 'score') return 'DECLINED: score below 500. The form I\'m required to slide across the counter says "we believe in you," and then lists, at length, why we don\'t.';
  return 'DECLINED: that would exceed your limit of ' + creditLimit(meta) + ' g. The limit believes in you exactly four times your income.';
}

export function talkTo(n, game, dialog, fx) {
  const quest = game.quest, player = game.player, meta = game.meta;

  if (n.name === 'Clerk Hespeth') {
    if (quest.stage === 0) dialog.say(n.name, [
      hespethLine(meta.deaths),
      'TICKET #44,107. "Go downstairs and cancel the apocalypse. Should be quick." *stamp*',
      'Before the Guild insures you for the Downstairs, prove you can handle pests. Five of the geese. Legally they are not pests — they are "an ongoing incident." Stampathy believes in you. Stampathy is a stamp.',
      'The Guild does not issue weapons. Budget. There\'s a fellow in the west meadow with… opinions about sticks. I\'d go see him before you go see a goose.'
    ], () => { startHunt(quest); fx.questChanged(); });
    else if (quest.stage === 1) dialog.say(n.name, [
      'The geese. ' + (quest.need - quest.kills) + ' more. You won\'t have to find them. That is the one mercy of geese. I have prepared the stamp.'
    ]);
    else if (quest.stage === 2) dialog.say(n.name, [
      'Five geese. Verified. Stamped. *stamp* That one wasn\'t necessary. *stamp* Neither was that.',
      'Fifteen gold, hazard rate. The hazard rate went down. You survived, so clearly it wasn\'t hazardous. Also: this is payroll, which means you now have verifiable income. The gift shop will explain why that matters. At length.',
      'Now: the Reenactor holds the Victory Site northeast. He has performed the Battle of Greater Pflum daily for forty years. Both sides. Alone. Your ticket is, apparently, a prop he needs.',
      'When he charges — he announces it first. Loudly. It\'s theater. You\'ll know.'
    ], () => { claimReward(game); fx.sfx('coin'); fx.hudChanged(); fx.questChanged(); });
    else if (quest.stage === 3) {
      if (!meta.credentials.backstory) {
        dialog.say(n.name, [
          'The Reenactor. Northeast. Buy Glurp first. (See label.)',
          'Also: the Door Golem will want a notarized tragic backstory before the Downstairs. The Ledger has\u2026 volunteered to write yours. It\'s been waiting. It has drafts.'
        ], () => {
          dialog.setSpeaker(n.name);
          dialog.setText('Shall I notarize the Ledger\u2019s draft? You don\u2019t get to read it first. Those are the rules. The Ledger made the rules.');
          dialog.open();
          dialog.choice([
            { label: '\u{1F4D6} Notarize it · free', fn: () => {
              grantBackstory(meta);
              fx.sfx('level');
              dialog.setText(ledgerize('*stamp* Done. Excerpt: "Our hero\u2019s original village was definitely eaten by a sadness. Possibly a lake. The Ledger was not there but feels strongly." \u2014 It\u2019s notarized. I\u2019m sorry.'));
              dialog.showHint();
            }},
            { label: 'Not yet', fn: () => {
              dialog.setText('Stampathy will wait. Stampathy is patient. I am also those things, technically.');
              dialog.showHint();
            }}
          ]);
        });
      } else dialog.say(n.name, [
        'The Reenactor. Northeast. Buy Glurp first. (See label.)',
        'Deaths on file: ' + meta.deaths + '. Day ' + meta.day + '. Body bin\'s where it always is.'
      ]);
    }
    else {
      if (!meta.credentials.backstory) {
        dialog.say(n.name, [
          hespethLine(meta.deaths),
          'The Door Golem won\'t let you Downstairs without a notarized tragic backstory. The Ledger has a draft. The Ledger has SEVERAL drafts.'
        ], () => {
          dialog.setSpeaker(n.name);
          dialog.setText('Notarize the Ledger\u2019s draft?');
          dialog.open();
          dialog.choice([
            { label: '\u{1F4D6} Notarize it · free', fn: () => {
              grantBackstory(meta);
              fx.sfx('level');
              dialog.setText(ledgerize('*stamp* Notarized. The original draft was longer. You\u2019re welcome.'));
              dialog.showHint();
            }},
            { label: 'Not yet', fn: () => { dialog.setText('Body bin\'s where it always is.'); dialog.showHint(); }}
          ]);
        });
      } else {
        const lines = [
          hespethLine(meta.deaths),
          'Ticket\'s stamped. The cancellation desk is on the bottom floor. Behind the boss. Of course it is. Day ' + meta.day + ', if you\'re keeping count. The Ledger is.'
        ];
        if (meta.credit.score >= 750) lines.push('Also the Guild Plus Card people called about you. Twice. I gave them your address. It seemed legal.');
        dialog.say(n.name, lines);
      }
    }

  } else if (n.name === 'Gift Shop Gnoll') {
    // one path for every SKU: cash or the account, by the book
    const buy = (price, ownedCheck, ownedText, apply, soldText) => ({
      cash: () => {
        if (ownedCheck()) dialog.setText(ownedText);
        else if (player.gold >= price) { player.gold -= price; apply(); fx.hudChanged(); dialog.setText(soldText); }
        else dialog.setText(price + ' gold. The register does not do wishes.');
        dialog.showHint();
      },
      credit: () => {
        if (ownedCheck()) dialog.setText(ownedText);
        else {
          const v = canBorrow(meta, price);
          if (!v.ok) dialog.setText(declineText(v.reason, meta));
          else {
            borrow(meta, price); apply(); fx.hudChanged();
            dialog.setText('Financed: ' + price + ' g at ' + pct(aprFor(meta.credit.score)) +
              ' APR (' + tierName(meta.credit.score) + '). Balance: ' + meta.credit.balance +
              ' g. Your debt is now officially crippling. This is a credential. Welcome to finance.');
          }
        }
        dialog.showHint();
      }
    });
    const skus = {
      glurp: buy(20, () => false, '',
        () => { player.potions++; fx.sfx('coin'); },
        'Ingredients: fluid, attitude, eels (fewer). Glurp will not fix you.*  (*Glurp will mostly fix you.)'),
      dirk: buy(60, () => player.swordLv >= 2,
        'You already have a DIRK! or better. Brand loyalty. The mascot salutes you. He has arms. Don\'t ask.',
        () => { player.swordLv = 2; fx.sfx('level'); },
        'DIRK! It\'s basically a sword! That\'s the whole slogan. Legal made us keep "basically."'),
      ultra: buy(400, () => player.swordLv >= 3,
        'You already swing ULTRA-class or better. The engineers send their regards. All nine of them.',
        () => { player.swordLv = 3; fx.sfx('level'); },
        'DIRK! ULTRA. Engineered composite. "Basically a better sword." The materials data sheet is laminated. Hespeth did that.')
    };

    const accountMenu = () => {
      const c = meta.credit;
      dialog.setSpeaker(n.name);
      dialog.setText('Account: balance ' + c.balance + ' g \u00B7 score ' + c.score + ' (' + tierName(c.score) +
        ', ' + pct(aprFor(c.score)) + ' APR) \u00B7 limit ' + creditLimit(meta) + ' g \u00B7 minimum due ' + minPayment(c) + ' g.');
      dialog.open();
      dialog.choice([
        { label: '\u{1F9EA} GLURP\u2122 on credit', fn: skus.glurp.credit },
        { label: '\u2694 DIRK!\u2122 on credit', fn: skus.dirk.credit },
        { label: '\u2694 ULTRA\u2122 on credit', fn: skus.ultra.credit },
        { label: '\u{1F4B0} Pay down debt', fn: () => {
          const paid = payDown(meta, player.gold);
          player.gold -= paid;
          fx.hudChanged();
          dialog.setText(paid > 0
            ? ('Paid ' + paid + ' g. Balance: ' + meta.credit.balance + ' g.' +
               (meta.credit.balance === 0 ? ' Cleared. The sticker comes off the file. Stampathy is misty.' : ''))
            : 'Nothing to pay with, or nothing to pay. Either way the register and I salute the attempt.');
          dialog.showHint();
        }},
        { label: '\u{1F4C4} Read the terms', fn: () => {
          dialog.say('TRUTH IN LENDING', truthInLending(meta), () => accountMenu());
        }},
        { label: 'Back', fn: () => mainMenu() }
      ]);
    };

    const mainMenu = () => {
      dialog.setSpeaker(n.name);
      dialog.setText('GLURP\u2122 20g ("Now With Fewer Eels!") \u00B7 DIRK!\u2122 60g ("It\'s basically a sword!") \u00B7 DIRK! ULTRA\u2122 400g ("Engineered.")');
      dialog.open();
      dialog.choice([
        { label: '\u{1F9EA} GLURP\u2122 \u00B7 20g', fn: skus.glurp.cash },
        { label: '\u2694 DIRK!\u2122 \u00B7 60g', fn: skus.dirk.cash },
        { label: '\u2694 ULTRA\u2122 \u00B7 400g', fn: skus.ultra.cash },
        { label: '\u{1F4B3} Credit & Account', fn: accountMenu },
        { label: 'Leave', fn: () => {
          dialog.setText('\u{1F3B5} If you\'re hurt or sad or cursed or dead-ish\u2014 \u{1F3B5} it loops. Walk fast.');
          dialog.showHint();
        }}
      ]);
    };

    const greeting = meta.credit.score >= 750
      ? ['\u{1F3B5} GLURP! It\'s adventure fluid! \u{1F3B5} \u2014 and WONDERFUL news! Your score pre-qualifies you for the GnollCard\u2122 Preferred at 9.99% APR. I am contractually thrilled. What do you need?']
      : ['\u{1F3B5} GLURP! It\'s adventure fluid! \u{1F3B5} \u2014 sorry. It loops. What do you need?'];
    dialog.say(n.name, greeting, mainMenu);

  } else if (n.name === 'GLURP-O-MATIC') {
    const greeting = meta.credit.score >= 750
      ? ['THE GLURP-O-MATIC HUMS. The display scrolls: "WELCOME, PREFERRED ADVENTURER. PRE-QUALIFIED. 9.99% APR. THE MACHINE KNOWS YOUR NAME."']
      : ['THE GLURP-O-MATIC HUMS. GLURP™: 20 g. The coin slot has seen things. (See label.)'];
    dialog.say(n.name, greeting, () => {
      dialog.setSpeaker(n.name);
      dialog.setText('GLURP™ — 20 g. "Now With Fewer Eels!" The tray is sticky. That is a feature.');
      dialog.open();
      dialog.choice([
        { label: '\u{1F9EA} Insert 20 g', fn: () => {
          if (player.gold >= 20) {
            player.gold -= 20; player.potions++;
            fx.sfx('coin'); fx.hudChanged();
            dialog.setText('CLUNK. One Glurp. The machine plays 0.5 seconds of the jingle. It is enough.');
          } else dialog.setText('The display reads: "EXACT CHANGE ONLY." You do not have inexact change either.');
          dialog.showHint();
        }},
        { label: '\u{1F4B3} On credit', fn: () => {
          const v = canBorrow(meta, 20);
          if (!v.ok) dialog.setText('The display reads: "' + declineText(v.reason, meta) + '"');
          else {
            borrow(meta, 20); player.potions++;
            fx.sfx('coin'); fx.hudChanged();
            dialog.setText('CLUNK. Financed at ' + pct(aprFor(meta.credit.score)) + ' APR. Balance: ' +
              meta.credit.balance + ' g. The machine prints a receipt. The receipt is the long kind.');
          }
          dialog.showHint();
        }},
        { label: '\u{1F9B5} KICK IT', fn: () => {
          addMenace(meta, 'Kicked a vending machine. It was witnessed.');
          if (game.rng() < .25) {
            player.potions++;
            fx.sfx('coin'); fx.hudChanged();
            dialog.setText('Something clunks. A Glurp drops. The machine says nothing. It will remember.');
          } else {
            fx.sfx('push');
            dialog.setText('The machine absorbs the kick. The display flickers: "DECLINED." The incident has been documented. By the machine.');
          }
          dialog.showHint();
        }},
        { label: 'Walk away', fn: () => {
          dialog.setText('\u{1F3B5} …if you\'re hurt or sad or cursed or dead-ish… \u{1F3B5} The machine hums it slower down here.');
          dialog.showHint();
        }}
      ]);
    });

  } else if (n.name === "Skritch's Radio") {
    dialog.say(n.name, [
      'A radio, mid-set. A sticky note: DO NOT TOUCH. The note is signed by the radio.'
    ], () => {
      dialog.setSpeaker(n.name);
      dialog.setText('The note has been re-stuck several times. The adhesive is tired. The conviction is not.');
      dialog.open();
      dialog.choice([
        { label: '✋ TOUCH IT', fn: () => {
          addMenace(meta, "Touched Skritch's radio. The note specifically said.");
          fx.sfx('click');
          dialog.setText('You touch it. Nothing happens. Everything has been recorded. Somewhere, an imp feels a disturbance in his set list.');
          dialog.showHint();
        }},
        { label: 'Respect the note', fn: () => {
          dialog.setText('You step back. The note relaxes visibly. The radio plays on, unbetrayed.');
          dialog.showHint();
        }}
      ]);
    });

  } else if (n.name === 'Hermit Gorse') {
    if (player.swordLv < 1) {
      dialog.say(n.name, [
        'You\'ve got the hands of someone who slaps geese. Don\'t. They keep score.',
        'Here. Take Pointy. Family blade. Forged— well. Grown. Found, technically. She\'s seen things.',
        'She\'ll return to me when her quest is done. They always do. That\'s how sticks work.'
      ], () => {
        player.swordLv = Math.max(player.swordLv, 1);
        fx.sfx('level'); fx.hudChanged();
        fx.toast('Acquired: Pointy (a pointy stick). She\'s seen things.');
      });
    } else {
      dialog.say(n.name, [
        'How\'s Pointy? Don\'t answer. I\'d know if something happened. The birch would tell me. The birch tells me everything.'
      ]);
    }

  } else if (n.name === 'Docent Brell') {
    dialog.say(n.name, [
      'Welcome to the future site of the Royal Museum of Having Defeated Evil. Malgrath was slain forty-ONE years ago by a hero wielding the legendary sword Thirstbringer.',
      'And THAT\'S museum science.'
    ]);

  } else if (n.name === 'King Pfilbert') {
    dialog.say(n.name, [
      'Apocalypse? Sounds like a downstairs problem! We\'ll get \'em next year, champ.',
      'I\'ve been down there, you know. Floor one. Bought a magnet. Have you seen my magnet? It\'s on the throne. Everyone has seen the magnet.'
    ]);

  } else if (n.name === 'Safety Officer Dimwald') {
    dialog.say(n.name, [
      'This kingdom is a certified Safe Workplace. The banner is only a little on fire. Fire is a known feature of banners. Certified.',
      'The goose is exempt. Nobody certifies a goose.'
    ]);

  } else { // Picketing Hero
    const lines = quest.stage >= 3
      ? ['WHAT DO WE WANT! A REASONABLE DEDUCTIBLE! Anyway \u2014 the Reenactor announces his charge. It\'s theater. Step aside on "FAMOUS," strike on "CHARGE." We\'d do it ourselves but, you know. Strike.',
         'Nice gear, by the way. (We\'re heckling a child\'s job. We know. We\'re a little proud.)']
      : ['WHEN DO WE WANT IT! FOLLOWING STANDARD PROCESSING TIMES!',
         'You\'re the new hire? They gave the apocalypse ticket to\u2014 okay. Okay! Tip: the pigeons won\'t start it. The geese need no reason. Solidarity.'];
    dialog.say(n.name, lines);
  }
}
