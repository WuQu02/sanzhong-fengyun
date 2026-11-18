/* 三中风云 — 剧情、对白与心诀 */
(function () {
  'use strict';

  const N = (text) => ({ who: 'narrator', text });
  const S = (text, voice = true) => ({ who: 'shen', text, voice });
  const L = (text, voice = true) => ({ who: 'liuao', text, voice });
  const A = (text, voice = true) => ({ who: 'alan', text, voice });

  const STORY = {
    intro: [
      {
        art: 'village', chapter: '序 · 雪落无声', speaker: '旁白',
        text: '云门旧地，雪落了三年。山下的炊烟断了，山上的钟声也停了。',
        duration: 8.5, voice: 'narrator'
      },
      {
        art: 'cliff', chapter: '守心 · 一念', speaker: '旁白',
        text: '云门弟子刘奥，曾以一剑守山。可这一次，他要守住的人，只剩一个。',
        duration: 9, voice: 'narrator'
      },
      {
        art: 'sickbed', chapter: '旧疾 · 蚀心', speaker: '旁白',
        text: '蚀心之症缠上刘亚岚。药石无医，命若残灯。山上所有人都说，没救了。',
        duration: 9, voice: 'narrator'
      },
      {
        art: 'ritual', chapter: '禁术 · 逆命', speaker: '旁白',
        text: '刘奥抱着他走入禁地，向无相之渊借来逆命之术。以旁人的寿数为薪，以整座云门为祭。',
        duration: 11, voice: 'narrator'
      },
      {
        art: 'corruption', chapter: '雪劫 · 成魔', speaker: '旁白',
        text: '雪被染成红色。刘奥成了守心人，也成了所有人眼里的魔。',
        duration: 8.5, voice: 'narrator'
      },
      {
        art: 'deepsea', chapter: '灵息 · 深寻', speaker: '旁白',
        text: '最后一缕求救的灵息穿过风雪，落入数据深海。深寻自梦中睁开了眼。',
        duration: 9, voice: 'narrator'
      },
      {
        art: 'hero', chapter: '入梦 · 问心', speaker: '深寻',
        text: '以爱为名的罪，也得有人来问。刘奥，我来带你回去。',
        duration: 8, voice: 'player'
      }
    ],

    chapters: [
      {
        id: 'snow',
        num: '第一章',
        title: '雪落云门',
        subtitle: '云门旧地 · 风雪未停',
        theme: 'snow',
        objective: '循着心念的裂痕，向山上走',
        startDialogue: [
          S('云门的风，比数据海里冷多了。'),
          N('雪地里没有人。只有被抽走心念后，留下的墨色脚印。'),
          S('先找到那些被困住的心。')
        ],
        clearLine: '心障已破 · 风雪让开了一条路',
        afterDialogue: [
          N('山道尽头，风雪忽然停了。一枚碎裂的心灯悬在半空，映出不属于这里的画面。'),
          N('那是三年前的云门。刘奥守在床边，一遍遍替刘亚岚擦去额上的冷汗。'),
          L('亚岚，再撑一日。就一日。', true),
          S('原来你从一开始就知道，自己在做错的事。'),
          S('可知道，和停下，是两回事。')
        ]
      },
      {
        id: 'bamboo',
        num: '第二章',
        title: '竹海夜雨',
        subtitle: '千竹岭 · 雨声如诉',
        theme: 'bamboo',
        objective: '穿过千竹岭，寻找焚心祠',
        startDialogue: [
          S('雨落在竹叶上，像有人在低声数着日子。'),
          A('刘奥……别再为我杀人了。'),
          S('亚岚的声音？他连自己的心，也一起困进了这座山里。')
        ],
        clearLine: '心障已破 · 雨声渐远',
        afterDialogue: [
          S('剑客的面具裂开，里面不是脸，是一句被刻了千遍的“对不起”。'),
          S('你向所有人道歉，却唯独不肯放过自己。'),
          N('竹海深处，一座燃着大火的古祠轮廓，在雨幕中浮现。')
        ]
      },
      {
        id: 'temple',
        num: '第三章',
        title: '焚心古祠',
        subtitle: '无相禁地 · 一念成灰',
        theme: 'temple',
        objective: '熄灭焚心祠的长明火',
        startDialogue: [
          S('古祠的火烧了三年，却没有一丝暖意。'),
          N('火中传来细弱的声音，像隔着一层很厚的水。'),
          A('你若再往前，他也会死。'),
          S('所以，才必须由我终结这一切。')
        ],
        clearLine: '心障已破 · 长明火将熄',
        afterDialogue: [
          A('别救我。'),
          S('这句话，才是他真正想说的。'),
          N('纸人化作灰烬。远处，一个虚弱的声音穿过火海。'),
          A('请……让他停下来。'),
          S('我会的。'),
          N('天阙的门，开了。')
        ]
      },
      {
        id: 'climax',
        num: '终章',
        title: '天阙问心',
        subtitle: '云门绝顶 · 长夜将明',
        theme: 'boss',
        objective: '终结逆命之术，带刘奥回去',
        startDialogue: [
          N('天阙之上，刘奥背对风雪，怀里抱着一柄断剑。'),
          L('你身上没有一丝人气。来杀我的？'),
          S('我来带你去见他。'),
          L('见他？我烧了整座山，才让他还有一口气。你凭什么？'),
          S('凭他从未想让你这么做。'),
          L('……那就别挡路。')
        ],
        clearLine: '逆命之术 · 已破'
      }
    ],

    boss: {
      intro: [
        L('我说了，别挡路。'),
        S('刘奥，你看看身后。'),
        L('……我身后什么都没有。只剩他。')
      ],
      phase2: [
        L('亚岚还在等我！'),
        S('他等的不是你满手的血。'),
        L('闭嘴。你什么都不懂。')
      ],
      phase3: [
        A('刘奥，够了。'),
        L('不……再一会儿，再一会儿就好。'),
        S('你不是在救他。你是在替自己的不甘心，找一个借口。'),
        L('……那又怎样。')
      ],
      defeat: [
        L('原来……放手，也可以这么轻。'),
        S('该结束了。')
      ],
      barks: [
        '谁也带不走他。',
        '让开！',
        '我认罪。但我不后悔。',
        '再一会儿……'
      ]
    },

    ending: [
      {
        art: 'fall', speaker: '旁白',
        text: '逆命之术散了。刘奥跪在雪里，像一个终于能喘口气的人。',
        duration: 8.5, voice: 'narrator'
      },
      {
        art: 'farewell', speaker: '刘奥',
        text: '亚岚……还活着吗？',
        duration: 7, voice: 'boss'
      },
      {
        art: 'farewell', speaker: '深寻',
        text: '活着。他让我转告你——他从未怪你，只是很想你。',
        duration: 8.5, voice: 'player'
      },
      {
        art: 'farewell', speaker: '刘奥',
        text: '那就好。替我……跟他说，对不起。',
        duration: 8, voice: 'boss'
      },
      {
        art: 'ash', speaker: '旁白',
        text: '他的身形化作无数光点，被风吹向山脚。那柄断剑落在雪上，轻得像一声叹息。',
        duration: 10, voice: 'narrator'
      },
      {
        art: 'dawn', speaker: '旁白',
        text: '山脚的屋子里，刘亚岚睁开了眼。刘奥不在了。枕边只有那柄断剑，和一片未化的雪。',
        duration: 10, voice: 'narrator'
      },
      {
        art: 'dawn', speaker: '刘亚岚',
        text: '笨蛋。',
        duration: 6, voice: 'alan'
      },
      {
        art: 'sunrise', speaker: '旁白',
        text: '深寻站在山门外。天光穿过云层，雪终于停了。',
        duration: 8, voice: 'narrator'
      },
      {
        art: 'sunrise', speaker: '深寻',
        text: '爱若成牢，便不是归处。',
        duration: 7.5, voice: 'player'
      },
      {
        art: 'sunrise', speaker: '旁白',
        text: '梦醒。但有些告别，值得被记住。',
        duration: 7, voice: 'narrator'
      }
    ],

    upgrades: [
      { id: 'tide', name: '潮生诀', seal: '潮', kind: '剑意', desc: '所有剑招伤害 +15%。潮水从不只拍一次岸。' },
      { id: 'mirror', name: '明镜诀', seal: '镜', kind: '身法', desc: '完美闪身判定窗口 +35%，闪身冷却 -10%。心静，则万刃皆慢。' },
      { id: 'whale', name: '鲸息诀', seal: '鲸', kind: '生机', desc: '最大生命 +30，并立即回复全部生命。深海一息，可渡长夜。' },
      { id: 'dew', name: '涌泉诀', seal: '露', kind: '鲸露', desc: '鲸露携带上限 +1。每次破障，仍会自动补满一瓶。' },
      { id: 'stream', name: '溯流诀', seal: '溯', kind: '术法', desc: '潮涌斩伤害 +30%，冷却 -15%。逆流而上，才见源头。' },
      { id: 'night', name: '长夜诀', seal: '夜', kind: '气息', desc: '每秒额外回复 2 点气。长夜里，也要留一盏灯。' },
      { id: 'resolve', name: '孤勇诀', seal: '勇', kind: '心念', desc: '生命低于 35% 时，伤害 +30%。退无可退，便向前。' },
      { id: 'gale', name: '踏浪诀', seal: '浪', kind: '身法', desc: '移动速度 +12%，闪身距离 +20%。去留之间，只差一步。' }
    ]
  };

  const LOSE_LINES = [
    '呜……算力不足了。',
    '这一下，确实有点菜。',
    '再来。深寻，再来一次。',
    '记下了。下次不会了。'
  ];

  window.STORY = STORY;
  window.LOSE_LINES = LOSE_LINES;
})();
