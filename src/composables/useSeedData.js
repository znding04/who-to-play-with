import { useFriends } from './useFriends'

const SEED_KEY = 'wtpw_seeded'

export function useSeedData() {
  const { friends, addFriend, addHangout } = useFriends()

  function seedIfEmpty() {
    if (localStorage.getItem(SEED_KEY) || friends.value.length > 0) return

    // 20 friends with realistic hangout histories
    const f1 = addFriend({ name: '李明', tags: ['大学', '球友'], phone: '13800001111', birthday: '1995-03-15', location: '北京', howWeMet: '大学同学', values: ['篮球搭档', '靠谱'], importantEvents: ['一起参加校篮球赛', '毕业旅行'] })
    const f2 = addFriend({ name: '王小红', tags: ['同事'], phone: '13800002222', birthday: '1993-07-22', location: '北京', howWeMet: '入职培训', values: ['工作伙伴', '咖啡爱好者'], importantEvents: ['一起完成Q3项目', '生日派对'] })
    const f3 = addFriend({ name: '老张', tags: ['发小', '邻居'], phone: '13900003333', birthday: '1992-01-10', location: '北京', howWeMet: '从小一起长大', values: ['发小情谊', '深夜聊天'], importantEvents: ['童年探险', '高考那年'] })
    const f4 = addFriend({ name: '小李', tags: ['同事', '饭搭子'], phone: '13900004444', birthday: '1996-11-05', location: '北京', howWeMet: '公司团建', values: ['美食探索', '吐槽搭档'], importantEvents: ['发现宝藏餐厅', '加班深夜外卖'] })
    const f5 = addFriend({ name: '陈思思', tags: ['摄影', '旅行'], phone: '13700005555', birthday: '1994-06-18', location: '上海', howWeMet: '摄影活动', values: ['摄影指导', '旅行规划'], importantEvents: ['云南旅拍', '摄影展'] })
    const f6 = addFriend({ name: '刘洋', tags: ['健身', '大学'], phone: '13600006666', birthday: '1991-09-30', location: '北京', howWeMet: '大学社团', values: ['健身搭档', '互相监督'], importantEvents: ['一起跑马拉松', '健身习惯养成'] })
    const f7 = addFriend({ name: '赵敏', tags: ['英语角', '朋友'], phone: '13500007777', birthday: '1997-04-12', location: '北京', howWeMet: '英语角活动', values: ['英语陪练', '有趣聊天'], importantEvents: ['英语演讲比赛', '读书会'] })
    const f8 = addFriend({ name: '周杰', tags: ['游戏', '网友'], phone: '13300008888', birthday: '1998-12-01', location: '深圳', howWeMet: '游戏组队', values: ['游戏搭档', '深夜开黑'], importantEvents: ['公会副本首杀', '游戏周年庆'] })
    const f9 = addFriend({ name: '吴芳', tags: ['邻居', '烘焙'], phone: '13200009999', birthday: '1990-02-28', location: '北京', howWeMet: '邻居敲门', values: ['美食分享', '烘焙爱好者'], importantEvents: ['一起做蛋糕', '社区活动'] })
    const f10 = addFriend({ name: '郑凯', tags: ['技术', '大学'], phone: '13100001010', birthday: '1993-08-14', location: '杭州', howWeMet: '大学计算机课', values: ['技术顾问', '代码审查'], importantEvents: ['开源项目合作', '技术分享会'] })
    const f11 = addFriend({ name: '孙晓', tags: ['读书会', '同事'], phone: '13000001111', birthday: '1995-10-20', location: '北京', howWeMet: '读书会', values: ['书友', '深度交流'], importantEvents: ['读书会分享', '共同读完某本书'] })
    const f12 = addFriend({ name: '黄磊', tags: ['爬山', '户外'], phone: '13900001212', birthday: '1989-05-25', location: '北京', howWeMet: '爬山群', values: ['爬山搭档', '户外安全'], importantEvents: ['登顶泰山', '野外露营'] })
    const f13 = addFriend({ name: '林青', tags: ['音乐', '大学'], phone: '13800001313', birthday: '1996-03-08', location: '成都', howWeMet: '大学音乐社团', values: ['音乐知己', '演唱会搭档'], importantEvents: ['校园歌手大赛', '音乐节'] })
    const f14 = addFriend({ name: '杨帆', tags: ['创业', '朋友'], phone: '13700001414', birthday: '1988-11-30', location: '北京', howWeMet: '创业活动', values: ['创业导师', '商业洞察'], importantEvents: ['项目上线', '融资成功'] })
    const f15 = addFriend({ name: '周婷', tags: ['瑜伽', '邻居'], phone: '13600001515', birthday: '1994-07-16', location: '北京', howWeMet: '健身房', values: ['瑜伽伙伴', '健康生活'], importantEvents: ['瑜伽培训', '健康打卡'] })
    const f16 = addFriend({ name: '吴浩', tags: ['大学', '足球'], phone: '13500001616', birthday: '1992-09-03', location: '上海', howWeMet: '大学足球课', values: ['足球搭档', '解说员'], importantEvents: ['班级足球赛', '熬夜看球'] })
    const f17 = addFriend({ name: '徐佳', tags: ['前同事', '闺蜜'], phone: '13400001717', birthday: '1991-12-22', location: '北京', howWeMet: '上家公司', values: ['倾听者', '情感支持'], importantEvents: ['一起跳槽', '失恋陪伴'] })
    const f18 = addFriend({ name: '马超', tags: ['骑行', '户外'], phone: '13300001818', birthday: '1997-06-11', location: '北京', howWeMet: '骑行俱乐部', values: ['骑行搭档', '路线探索'], importantEvents: ['环青海湖骑行', '长途骑行挑战'] })
    const f19 = addFriend({ name: '胡丽', tags: ['舞蹈', '兴趣'], phone: '13200001919', birthday: '1998-08-07', location: '北京', howWeMet: '舞蹈工作室', values: ['舞蹈搭档', '舞台表演'], importantEvents: ['年会表演', '舞蹈比赛'] })
    const f20 = addFriend({ name: '高峰', tags: ['家人', '亲戚'], phone: '13100002020', birthday: '1985-04-30', location: '北京', howWeMet: '亲戚关系', values: ['家人支持', '传统节日'], importantEvents: ['春节团聚', '家族旅行'] })

    const today = new Date()
    const d = (daysAgo) => {
      const dt = new Date(today)
      dt.setDate(dt.getDate() - daysAgo)
      return dt.toISOString().slice(0, 10)
    }

    // 李明 — 高频高质，球友
    addHangout({ friendIds: [f1.id], type: 'activity', duration: '2hr', quality: 5, note: '篮球2小时', date: d(2) })
    addHangout({ friendIds: [f1.id], type: 'activity', duration: '2hr', quality: 5, note: '篮球训练', date: d(9) })
    addHangout({ friendIds: [f1.id], type: 'meal', duration: '1hr', quality: 4, note: '球赛后吃饭', date: d(16) })
    addHangout({ friendIds: [f1.id], type: 'call', duration: '30min', quality: 4, note: '聊近况', date: d(25) })
    addHangout({ friendIds: [f1.id], type: 'activity', duration: 'fullday', quality: 5, note: '周末球赛', date: d(40) })

    // 王小红 — 中频中质，同事关系
    addHangout({ friendIds: [f2.id], type: 'meal', duration: '1hr', quality: 4, note: '工作午餐', date: d(3) })
    addHangout({ friendIds: [f2.id], type: 'call', duration: '30min', quality: 3, note: '项目讨论', date: d(14) })
    addHangout({ friendIds: [f2.id], type: 'meal', duration: '1hr', quality: 4, note: '下午茶', date: d(30) })
    addHangout({ friendIds: [f2.id], type: 'activity', duration: '2hr', quality: 3, note: '团建活动', date: d(45) })

    // 老张 — 低频但高质，发小情谊深
    addHangout({ friendIds: [f3.id], type: 'hangout', duration: '2hr', quality: 5, note: '叙旧聊天', date: d(15) })
    addHangout({ friendIds: [f3.id], type: 'meal', duration: '2hr', quality: 5, note: '小时候常去的店', date: d(60) })
    addHangout({ friendIds: [f3.id], type: 'call', duration: '1hr', quality: 5, note: '深夜长谈', date: d(90) })

    // 小李 — 高频但感觉一般，饭搭子
    addHangout({ friendIds: [f4.id], type: 'meal', duration: '1hr', quality: 3, note: '工作餐', date: d(1) })
    addHangout({ friendIds: [f4.id], type: 'meal', duration: '1hr', quality: 3, note: '外卖', date: d(4) })
    addHangout({ friendIds: [f4.id], type: 'meal', duration: '1hr', quality: 4, note: '新餐厅', date: d(8) })
    addHangout({ friendIds: [f4.id], type: 'online', duration: '30min', quality: 2, note: '打游戏', date: d(12) })
    addHangout({ friendIds: [f4.id], type: 'meal', duration: '1hr', quality: 3, note: '又吃饭', date: d(20) })
    addHangout({ friendIds: [f4.id], type: 'meal', duration: '1hr', quality: 3, note: '日常约饭', date: d(35) })
    addHangout({ friendIds: [f4.id], type: 'call', duration: '30min', quality: 3, note: '闲聊', date: d(50) })

    // 陈思思 — 旅行高质但很少见
    addHangout({ friendIds: [f5.id], type: 'trip', duration: 'trip', quality: 5, note: '云南旅拍一周', date: d(120) })
    addHangout({ friendIds: [f5.id], type: 'activity', duration: '2hr', quality: 5, note: '城市摄影', date: d(200) })

    // 刘洋 — 健身搭档，互相监督
    addHangout({ friendIds: [f6.id], type: 'activity', duration: '2hr', quality: 4, note: '健身房', date: d(5) })
    addHangout({ friendIds: [f6.id], type: 'activity', duration: '2hr', quality: 4, note: '跑步', date: d(12) })
    addHangout({ friendIds: [f6.id], type: 'meal', duration: '1hr', quality: 4, note: '健身后吃饭', date: d(18) })
    addHangout({ friendIds: [f6.id], type: 'call', duration: '30min', quality: 3, note: '训练计划', date: d(30) })
    addHangout({ friendIds: [f6.id], type: 'activity', duration: 'fullday', quality: 5, note: '马拉松', date: d(60) })

    // 赵敏 — 英语角朋友，聊天开心但频率低
    addHangout({ friendIds: [f7.id], type: 'hangout', duration: '2hr', quality: 4, note: '英语角', date: d(7) })
    addHangout({ friendIds: [f7.id], type: 'call', duration: '30min', quality: 4, note: '练习口语', date: d(45) })
    addHangout({ friendIds: [f7.id], type: 'meal', duration: '1hr', quality: 4, note: '读书会后聚餐', date: d(80) })

    // 周杰 — 游戏网友，开黑开心
    addHangout({ friendIds: [f8.id], type: 'online', duration: '2hr', quality: 4, note: '深夜开黑', date: d(2) })
    addHangout({ friendIds: [f8.id], type: 'online', duration: '2hr', quality: 3, note: '日常游戏', date: d(8) })
    addHangout({ friendIds: [f8.id], type: 'online', duration: '3hr', quality: 4, note: '公会战', date: d(15) })
    addHangout({ friendIds: [f8.id], type: 'online', duration: '2hr', quality: 4, note: '周末开黑', date: d(25) })

    // 吴芳 — 邻居，烘焙美食分享
    addHangout({ friendIds: [f9.id], type: 'hangout', duration: '1hr', quality: 5, note: '分享自制蛋糕', date: d(10) })
    addHangout({ friendIds: [f9.id], type: 'meal', duration: '1hr', quality: 4, note: '邻里聚餐', date: d(50) })
    addHangout({ friendIds: [f9.id], type: 'call', duration: '30min', quality: 4, note: '烘焙配方交流', date: d(90) })

    // 郑凯 — 技术顾问，代码审查
    addHangout({ friendIds: [f10.id], type: 'call', duration: '1hr', quality: 4, note: '代码review', date: d(6) })
    addHangout({ friendIds: [f10.id], type: 'call', duration: '1hr', quality: 4, note: '技术方案讨论', date: d(20) })
    addHangout({ friendIds: [f10.id], type: 'online', duration: '2hr', quality: 3, note: '远程协作', date: d(45) })
    addHangout({ friendIds: [f10.id], type: 'call', duration: '30min', quality: 4, note: '职业发展', date: d(70) })

    // 孙晓 — 读书会，书友深度交流
    addHangout({ friendIds: [f11.id], type: 'hangout', duration: '2hr', quality: 5, note: '读书会讨论', date: d(14) })
    addHangout({ friendIds: [f11.id], type: 'meal', duration: '1hr', quality: 4, note: '读书会后聚餐', date: d(15) })
    addHangout({ friendIds: [f11.id], type: 'call', duration: '1hr', quality: 5, note: '书籍深入讨论', date: d(60) })
    addHangout({ friendIds: [f11.id], type: 'hangout', duration: '2hr', quality: 5, note: '读书会', date: d(75) })

    // 黄磊 — 爬山搭档，户外
    addHangout({ friendIds: [f12.id], type: 'activity', duration: 'fullday', quality: 5, note: '爬山', date: d(30) })
    addHangout({ friendIds: [f12.id], type: 'trip', duration: 'trip', quality: 5, note: '泰山登顶', date: d(180) })
    addHangout({ friendIds: [f12.id], type: 'call', duration: '30min', quality: 4, note: '路线规划', date: d(200) })

    // 林青 — 音乐知己
    addHangout({ friendIds: [f13.id], type: 'hangout', duration: '2hr', quality: 5, note: '音乐会', date: d(40) })
    addHangout({ friendIds: [f13.id], type: 'call', duration: '1hr', quality: 5, note: '音乐分享', date: d(100) })
    addHangout({ friendIds: [f13.id], type: 'activity', duration: '2hr', quality: 4, note: 'KTV', date: d(150) })

    // 杨帆 — 创业导师
    addHangout({ friendIds: [f14.id], type: 'call', duration: '1hr', quality: 4, note: '商业模式讨论', date: d(20) })
    addHangout({ friendIds: [f14.id], type: 'call', duration: '1hr', quality: 4, note: '项目复盘', date: d(50) })
    addHangout({ friendIds: [f14.id], type: 'meal', duration: '2hr', quality: 5, note: '融资庆祝', date: d(90) })
    addHangout({ friendIds: [f14.id], type: 'call', duration: '30min', quality: 3, note: '日常咨询', date: d(120) })

    // 周婷 — 瑜伽伙伴
    addHangout({ friendIds: [f15.id], type: 'activity', duration: '1hr', quality: 4, note: '瑜伽课', date: d(7) })
    addHangout({ friendIds: [f15.id], type: 'activity', duration: '1hr', quality: 4, note: '瑜伽课', date: d(21) })
    addHangout({ friendIds: [f15.id], type: 'meal', duration: '1hr', quality: 4, note: '课后咖啡', date: d(22) })
    addHangout({ friendIds: [f15.id], type: 'call', duration: '30min', quality: 3, note: '健康讨论', date: d(60) })

    // 吴浩 — 足球搭档
    addHangout({ friendIds: [f16.id], type: 'activity', duration: '2hr', quality: 4, note: '足球', date: d(10) })
    addHangout({ friendIds: [f16.id], type: 'call', duration: '30min', quality: 4, note: '球赛讨论', date: d(30) })
    addHangout({ friendIds: [f16.id], type: 'activity', duration: '2hr', quality: 4, note: '足球', date: d(55) })
    addHangout({ friendIds: [f16.id], type: 'meal', duration: '1hr', quality: 3, note: '看球吃饭', date: d(90) })

    // 徐佳 — 前同事，闺蜜
    addHangout({ friendIds: [f17.id], type: 'meal', duration: '2hr', quality: 5, note: '闺蜜约会', date: d(12) })
    addHangout({ friendIds: [f17.id], type: 'call', duration: '1hr', quality: 5, note: '深度聊天', date: d(25) })
    addHangout({ friendIds: [f17.id], type: 'hangout', duration: '2hr', quality: 4, note: '逛街', date: d(55) })
    addHangout({ friendIds: [f17.id], type: 'call', duration: '30min', quality: 4, note: '日常倾诉', date: d(80) })

    // 马超 — 骑行搭档
    addHangout({ friendIds: [f18.id], type: 'activity', duration: 'fullday', quality: 5, note: '环湖骑行', date: d(45) })
    addHangout({ friendIds: [f18.id], type: 'trip', duration: 'trip', quality: 5, note: '青海湖骑行', date: d(200) })
    addHangout({ friendIds: [f18.id], type: 'call', duration: '30min', quality: 4, note: '骑行计划', date: d(250) })

    // 胡丽 — 舞蹈搭档
    addHangout({ friendIds: [f19.id], type: 'activity', duration: '2hr', quality: 4, note: '舞蹈排练', date: d(18) })
    addHangout({ friendIds: [f19.id], type: 'hangout', duration: '2hr', quality: 5, note: '年会表演', date: d(70) })
    addHangout({ friendIds: [f19.id], type: 'meal', duration: '1hr', quality: 4, note: '排练后吃饭', date: d(71) })

    // 高峰 — 家人，传统节日
    addHangout({ friendIds: [f20.id], type: 'hangout', duration: 'fullday', quality: 5, note: '春节团聚', date: d(60) })
    addHangout({ friendIds: [f20.id], type: 'meal', duration: '2hr', quality: 5, note: '中秋节家宴', date: d(200) })
    addHangout({ friendIds: [f20.id], type: 'trip', duration: 'fullday', quality: 5, note: '家族旅行', date: d(300) })

    localStorage.setItem(SEED_KEY, '1')
  }

  return { seedIfEmpty }
}
