const express = require('express');
const axios = require('axios');
const router = express.Router();

axios.defaults.headers.origin = 'http://localhost:8003';
router.get('/', (req, res) => {
  res.render('main', { key: process.env.FRONT_SECRET });
});

const request = async (req, api) => {
  try {
    if(!req.session.jwt) {
      const tokenResult = await axios.post('http://localhost:8002/v2/token', {
        clientSecret: process.env.CLIENT_SECRET
      });
      // 토큰 발급에 성공 -> 세션에 저장
      if(tokenResult.data && tokenResult.data.code === 200) {
        req.session.jwt = tokenResult.data.token;
      }
    }
    // 발급받은 토큰으로 테스트
    return await axios.get(`http://localhost:8002/v2${api}`, {
      headers: { authorization: req.session.jwt },
    });
  } catch(error) {
    console.error(error);
    // 만료 시 재발급
    if(error.response.status === 419) {
      delete req.session.jwt;
      return request(req, api);
    }
    return error.response;
  }
}

router.get('/test', async (req, res, next) => {
  try {
    if(!req.session.jwt) {
      const tokenResult = await axios.post('http://localhost:8002/v2/token', {
        clientSecret: process.env.CLIENT_SECRET
      });
      if(tokenResult.data && tokenResult.data.code === 200) {
        req.session.jwt = tokenResult.data.token;
      } 
    }
    const result = await axios.get('http://localhost:8002/v2/test', {
      headers: { authorization: req.session.jwt },
    });
    return res.json(result.data);
  } catch(error) {
    console.error(error);
    if(error.response.status === 419) {
      return res.json(error.response.data);
    }
    return next(error);
  }
});

router.get('/mypost', async (req, res, next) => {
  try {
    const result = await request(req, '/posts/my');
    res.json(result.data);
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.get('/search/:hashtag', async (req, res, next) => {
  try {
    const result = await request(req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`);
    res.json(result.data);
  } catch(error) {
    console.error(error);
    next(error);
  }
});

router.get('/follow', async (req, res, next) => {
  try {
    const result = await request(req, `/follow`);
    res.json(result.data);
  } catch(error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;