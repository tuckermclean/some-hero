// All hub dialogue. Content only — dialog-box mechanics live in
// ui/dialog.js, quest/gold mutations go through the systems.
//
// Tone rules apply: every named character has a bit, a catchphrase, and
// one wrong belief they will defend forever.

import { startHunt, claimReward } from '../systems/quest.js';
import { hespethLine } from './hespeth.js';
import { grantBackstory, grantDebt } from '../systems/credentials.js';
import { ledgerize } from '../systems/ledger.js';

export function talkTo(n, game, dialog, fx) {
  const quest = game.quest, player = game.player, meta = game.meta;

  if (n.name === 'Clerk Hespeth') {
    if (quest.stage === 0) dialog.say(n.name, [
      hespethLine(meta.deaths),
      'TICKET #44,107. "Go downstairs and cancel the apocalypse. Should be quick." *stamp*',
      'Before the Guild insures you for the Downstairs, prove you can handle pests. Five of the plaza pigeons. They won\'t start it. You will. Stampathy believes in you. Stampathy is a stamp.'
    ], () => { startHunt(quest); fx.questChanged(); });
    else if (quest.stage === 1) dialog.say(n.name, [
      'The pigeons. ' + (quest.need - quest.kills) + ' more. Mind the flock — they remember faces. I have prepared the stamp.'
    ]);
    else if (quest.stage === 2) dialog.say(n.name, [
      'Five pigeons. Verified. Stamped. *stamp* That one wasn\'t necessary. *stamp* Neither was that.',
      'Fifty gold, hazard rate. Now: the Reenactor holds the Victory Site northeast. He has performed the Battle of Greater Pflum daily for forty years. Both sides. Alone. Your ticket is, apparently, a prop he needs.',
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
      } else dialog.say(n.name, [
        hespethLine(meta.deaths),
        'Ticket\'s stamped. The cancellation desk is on the bottom floor. Behind the boss. Of course it is. Day ' + meta.day + ', if you\'re keeping count. The Ledger is.'
      ]);
    }

  } else if (n.name === 'Gift Shop Gnoll') {
    dialog.say(n.name, ['\u{1F3B5} GLURP! It\'s adventure fluid! \u{1F3B5} \u2014 sorry. It loops. What do you need?'], () => {
      dialog.setSpeaker(n.name);
      dialog.setText('GLURP\u2122 20g ("Now With Fewer Eels!") \u00B7 DIRK!\u2122 60g ("It\'s basically a sword!")');
      dialog.open();
      dialog.choice([
        { label: '\u{1F9EA} GLURP\u2122 \u00B7 20g', fn: () => {
          if (player.gold >= 20) {
            player.gold -= 20; player.potions++;
            fx.sfx('coin'); fx.hudChanged();
            dialog.setText('Ingredients: fluid, attitude, eels (fewer). Glurp will not fix you.*  (*Glurp will mostly fix you.)');
          } else dialog.setText('Twenty gold. The eels don\'t remove themselves. Well. Most of them don\'t.');
          dialog.showHint();
        }},
        { label: '\u2694 DIRK!\u2122 \u00B7 60g', fn: () => {
          if (player.swordLv > 1) dialog.setText('You already have a DIRK! or better. Brand loyalty. The mascot salutes you. He has arms. Don\'t ask.');
          else if (player.gold >= 60) {
            player.gold -= 60; player.swordLv = 2;
            fx.sfx('level'); fx.hudChanged();
            dialog.setText('DIRK! It\'s basically a sword! That\'s the whole slogan. Legal made us keep "basically."');
          } else dialog.setText('Sixty gold. The mascot does not haggle. The mascot is a dirk with arms.');
          dialog.showHint();
        }},
        { label: '\u{1F4B3} GLURP\u2122 on credit', fn: () => {
          if (meta.credentials.debt) {
            dialog.setText('Your account is already\u2026 *checks* \u2026"crippling." Congratulations. The golem will be pleased. He won\'t show it.');
          } else {
            player.potions++;
            grantDebt(meta);
            fx.sfx('coin'); fx.hudChanged();
            dialog.setText('One Glurp, zero gold down, APR best described as "adventurous." Your debt is now officially crippling. This is a credential. Welcome to finance.');
          }
          dialog.showHint();
        }},
        { label: 'Leave', fn: () => {
          dialog.setText('\u{1F3B5} If you\'re hurt or sad or cursed or dead-ish\u2014 \u{1F3B5} it loops. Walk fast.');
          dialog.showHint();
        }}
      ]);
    });

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
