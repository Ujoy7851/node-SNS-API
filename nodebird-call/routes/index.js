const express = require('express');
const axios = require('axios');
const router = express.Router();

const request = async (req, api) => {
  try {
    if(!req.session.jwt) {
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET
      });
      // 토큰 발급에 성공 -> 세션에 저장
      if(tokenResult.data && tokenResult.data.code === 200) {
        req.session.jwt = tokenResult.data.token;
      }
    }
    // 발급받은 토큰으로 테스트
    return await axios.get(`http://localhost:8002/v1${api}`, {
      headers: { authorization: req.session.jwt },
    });
  } catch(error) {
    console.error(error);
    if(error.response.status < 500) {
      return error.response;
    }
    throw error;
  }
}

router.get('/test', async (req, res, next) => {
  try {
    // 세션에 토큰이 없는 경우
    if(!req.session.jwt) {
      const tokenResult = await axios.post('http://localhost:8002/v1/token', {
        clientSecret: process.env.CLIENT_SECRET
      });
      // 토큰 발급에 성공 -> 세션에 저장
      if(tokenResult.data && tokenResult.data.code === 200) {
        req.session.jwt = tokenResult.data.token;
      } 
    }
    // 발급받은 토큰으로 테스트
    const result = await axios.get('http://localhost:8002/v1/test', {
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