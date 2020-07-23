const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Domain, Post, Hashtag } = require('../models');
const { verifyToken, deprecated } = require('./middlewares');

const router = express.Router();

// router.use() 사용하면 모든 라우터에 미들웨어 적용
// router.use(deprecated);

router.post('/token', async (req, res, next) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attributes: ['id', 'nick']
      }
    });
    if(!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요.'
      });
    }
    const token = jwt.sign({
      id: domain.User.id,
      nick: domain.User.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '1m',
      issuer: 'nodebird'
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다.',
      token
    });
  } catch(error) {
    return res.status(500).json({
      code: 500,
      message: '서버 에러'
    });
  }
});

router.get('/test', verifyToken, (req, res) => {
  return res.json(req.decoded);
});

router.get('/posts/my', verifyToken, async (req, res) => {
  try {
    const posts = await Post.findAll({ where: {UserId: req.decoded.id } });
    return res.json({
      code: 200,
      payload: posts
    });
  } catch(error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러'
    });
  }
});

router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
  try {
    const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
    if(!hashtag) {
      return res.status(404).json({
        code: 404,
        message: '검색 결과가 없습니다.'
      });
    }
    const posts = await hashtag.getPosts();
    return res.json({
      code: 200,
      payload: posts
    });
  } catch(error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러'
    });
  }
});

router.get('/follow', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.decoded.id } });
    const follower = await user.getFollowers({ attributes: ['id', 'nick'] });
    const following = await user.getFollowings({ attributes: ['id', 'nick'] });
    return res.json({
      code: 200,
      follower,
      following
    })
  } catch(error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러'
    });
  }
})

module.exports = router;