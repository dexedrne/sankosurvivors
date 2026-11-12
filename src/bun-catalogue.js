// Exact native records captured from the official Quest manifests, 6 November 2026.
const freeze = (value) => { for (const item of Object.values(value)) if (item && typeof item === "object") freeze(item); return Object.freeze(value); };

export const BUN_PROVENANCE = freeze({
  "appearance_chunk_url": "https://sigma.sankoquest.com/_next/static/chunks/d7a389ecae32c8f0.js",
  "appearance_module": 918026,
  "animation_module": 451621,
  "asset_base_url": "https://cdn.sankoquest.com/assets",
  "source": "Sanko-Dream-Machine/sanko-pets@0913a7b9c2f7f1c56e4fc13c3efb06dc8a78a753",
  "appearanceVersion": "28ac9d55bb3536427649d5713550faf82e1d6b12c718f068d4e585900b1885f6"
});

export const BUN_APPEARANCES = freeze({
  "Angel": {"model": {"path": "sanko/buns/Angel.glb","sha256": "9ff1f8111f7ea876e240ed0c563d0bcb44a9674386695a9fd4b11492637dd2c1"},"portrait": {"path": "sanko/pets/portraits/Angel.png","sha256": "03e7b604a5f5110257e35df5e7e3120fd93de1b1ef269e640b28ada3b68820d2"}},
  "Blue": {"model": {"path": "sanko/buns/Blue.glb","sha256": "c9b833944b7e889095d1ef2cad9b2a1e3dd3f543bd1a4627c29e925c96a530f3"},"portrait": {"path": "sanko/pets/portraits/Blue.png","sha256": "f3296d35d0d6c4f9a71125dfc3c6c5cb362743a9a33753e6db7aef24ea545dd8"}},
  "Bomber": {"model": {"path": "sanko/buns/Bomber.glb","sha256": "d3138fa55621eb63f5c3818cc3832ba66f0c9934a8c53d1a3f9a84c31ae7a4b7"},"portrait": {"path": "sanko/pets/portraits/Bomber.png","sha256": "2e8c7f78d21e3067448380ed398484c5dd2a1f5641ea7d47fe60c8b01a228fce"}},
  "Bricks": {"model": {"path": "sanko/buns/Bricks.glb","sha256": "939c3963cd7b7e3a5d4d1fa5d3ebb80389e6dd7e182031672de76856bf091e6d"},"portrait": {"path": "sanko/pets/portraits/Bricks.png","sha256": "fe8e97376232694915a14861df38979a6255440aff8ba4635bccb6988c4c614e"}},
  "Buns": {"model": {"path": "sanko/buns/Buns.glb","sha256": "8c756a5de98e99dffb2ff97e9b021dede04b2b5c0f3b8006fe85f536c0832af7"},"portrait": {"path": "sanko/pets/portraits/Buns.png","sha256": "791e814b2320d46f8305303bdd30847c22fb84284113551781ae039b5dfde330"}},
  "Bunzilian": {"model": {"path": "sanko/buns/Bunzilian.glb","sha256": "ff4c4fc1bdc4edb60bff9a73b5e8eb2be70764219b8af7e690bc8d49b9be207f"},"portrait": {"path": "sanko/pets/portraits/Bunzilian.png","sha256": "78f3aa95655ccb979b85e4f43068a5af02ff99377d27eb900390b7444a4ced2b"}},
  "Chikki": {"model": {"path": "sanko/buns/Chikki.glb","sha256": "300a0a1851eba3a5bd51437fab8acb493c5da58e215d3bb2ec4a40433be8bec1"},"portrait": {"path": "sanko/pets/portraits/Chikki.png","sha256": "a7095bbf1329c7c581eae538d2967a1afb93239a579be55ee2aa6220de4c76f1"}},
  "Choi": {"model": {"path": "sanko/buns/Choi.glb","sha256": "1e358e07c0b63d57605ff811a2dd4190d8536a4ef7b0cf10a8b439bf57474268"},"portrait": {"path": "sanko/pets/portraits/Choi.png","sha256": "3a8f2314b91a0bc6b48c816d0b8ce5c963762ec9f754ab482b204d567a0ac7c6"}},
  "Cloudy": {"model": {"path": "sanko/buns/Cloudy.glb","sha256": "c5f1bf494ad9bd52f80746688dbb01bd6e19e602833d77860ba39b0bb75aab54"},"portrait": {"path": "sanko/pets/portraits/Cloudy.png","sha256": "678571686a21121a879985e447fa85319d1c09864e5a3332ea962e9a81d0fb42"}},
  "Confetti": {"model": {"path": "sanko/buns/Confetti.glb","sha256": "70911cdac87ccf41b0a43b4897b6d6bc3e1f3f3f0c0e4ec6b2dacd5c0453e732"},"portrait": {"path": "sanko/pets/portraits/Confetti.png","sha256": "b0fd0111b3a20bb12b782dbde6d925d30344c4a72cb1d7230a8d089a6c416a71"}},
  "Cowboy": {"model": {"path": "sanko/buns/Cowboy.glb","sha256": "b0c0bb19ad7a57895ab7a80156cfa36c9a915eab4a23c49050a3453742572471"},"portrait": {"path": "sanko/pets/portraits/Cowboy.png","sha256": "94c2b327785a2c69c84c8a93583993716d8e19e5e4aa49012630f4bea7cc30e6"}},
  "Cream": {"model": {"path": "sanko/buns/Cream.glb","sha256": "4a2f1cb90df956efab3a03258fb13db9ab296684fd03a43377a4210fd4fc4655"},"portrait": {"path": "sanko/pets/portraits/Cream.png","sha256": "a6a55682765040c5fa7cf9c9a69a8a46326531ffdf6c9287b808b92a98a6353d"}},
  "Crystal": {"model": {"path": "sanko/buns/Crystal.glb","sha256": "a4e35d5a0ec6d66a42a4f3d730fcdb4c953a5a89f7e12bf161adaa8e243660b1"},"portrait": {"path": "sanko/pets/portraits/Crystal.png","sha256": "3a5d225e08004eacead7f2f77f61989bd13616159f9d7c4e426dfeaa974400a1"}},
  "Detec": {"model": {"path": "sanko/buns/Detec.glb","sha256": "d24c720567f212a4dd84b5b0c4b9defec30cfdf54f87acfad344dfdee345a135"},"portrait": {"path": "sanko/pets/portraits/Detec.png","sha256": "0e7f12b9ed384be936572f4cdf25e0f1a8f81867318a6b8a4a4bbc4b79cdf6e4"}},
  "Dev": {"model": {"path": "sanko/buns/Dev.glb","sha256": "c1bc8408d9909ab7924d4a11a1492da15156c522164d2e66c6d12eed0b333510"},"portrait": {"path": "sanko/pets/portraits/Dev.png","sha256": "16ef01bdfdc0efb31d0d7fc34b9dcccd24eb35f7b590b5dabfea2e5fa513b4cc"}},
  "Driftwood": {"model": {"path": "sanko/buns/Driftwood.glb","sha256": "5c514f95749092e47f80df9d40fcd3003828f059ab12d2bf398ae3c69d305f3c"},"portrait": {"path": "sanko/pets/portraits/Driftwood.png","sha256": "1db016040cdd1f5342940c5ca2b7f48ea0caa3b5b09809973b5f52d155a130d8"}},
  "Earthy": {"model": {"path": "sanko/buns/Earthy.glb","sha256": "e01b1224ddd615608f593742f1d09fb08319b0df929f8125a061c594bd014408"},"portrait": {"path": "sanko/pets/portraits/Earthy.png","sha256": "d96ef1cc4330b01e3ebfdb73b36c3aa56063e85e7a9207c6779158e9dae36c85"}},
  "Fire": {"model": {"path": "sanko/buns/Fire.glb","sha256": "2155dfc00a28c6c1be7b820cf829b4b66e9ea0d13fc95446043f65b03ad44aa8"},"portrait": {"path": "sanko/pets/portraits/Fire.png","sha256": "7c67242b27f8076f0c70f4d39851798ba68984ca2bf13ec23f9b09d71270b6f6"}},
  "Galxy": {"model": {"path": "sanko/buns/Galxy.glb","sha256": "d366a1a1b529fb9a8227f2d9289b41348f1a9ea261ee8dc8d410f15f04f68d5e"},"portrait": {"path": "sanko/pets/portraits/Galxy.png","sha256": "f2f791f7d4b89a6e58507b7da661f7c654d77129d6c27247b3684fcae0dfee77"}},
  "Geeny": {"model": {"path": "sanko/buns/Geeny.glb","sha256": "6f9434cb20bf78fcf1210abaf11e2ad8e3625f2ad7349f6b94704d14ade2b3b6"},"portrait": {"path": "sanko/pets/portraits/Geeny.png","sha256": "b832a5a2b316535eab6aebaef0a4ec062f72cd2c612bf934d68be284fcb56a96"}},
  "Glass": {"model": {"path": "sanko/buns/Glass.glb","sha256": "9a2dfc26bf675aecb1ab003979605bc51462cab542ca1f74c4a4875ba7a578b7"},"portrait": {"path": "sanko/pets/portraits/Glass.png","sha256": "b5ce72626820751c3f47350beb5e861f3ef2e94e3c58e5662246824f143fe83f"}},
  "Goldie": {"model": {"path": "sanko/buns/Goldie.glb","sha256": "1575101c84a7d4c1d2566b849bc2be24a76d3d533e9243e57833412369b87b2b"},"portrait": {"path": "sanko/pets/portraits/Goldie.png","sha256": "4032159a34e4de12ea55ba62401bebfdedeafc949451e1cd5118b81f2c727f05"}},
  "Gorli": {"model": {"path": "sanko/buns/Gorli.glb","sha256": "8dbd53b3edc7e2f18667ccac29cc10b23c09002eea20fcd67e190b33ae8583a2"},"portrait": {"path": "sanko/pets/portraits/Gorli.png","sha256": "992009c1b5d2d860c5e4ba45a00ef15ebba951382a7845717b255d73f67ecf98"}},
  "Green": {"model": {"path": "sanko/buns/Green.glb","sha256": "6d8e4404ebc5053d9ca5738d2aeac9bc113cbe402ec75a29b4b394b82356db35"},"portrait": {"path": "sanko/pets/portraits/Green.png","sha256": "bfd37bf9ef25d2145eba9a4bb6e83142e10c5610b37aa9557a6d10d50b768fb1"}},
  "Hippy": {"model": {"path": "sanko/buns/Hippy.glb","sha256": "266a31d2c74b0b2366d20fb612f3bf7470b94e629e6a76685d81276facc1c3f9"},"portrait": {"path": "sanko/pets/portraits/Hippy.png","sha256": "46f322108bf76328408311dfd87a9042c9d04e9d5504867a5e4ceaabf7770529"}},
  "Joker": {"model": {"path": "sanko/buns/Joker.glb","sha256": "87004f19c46db606ab6521c56c64d632b0789aa3edc8425b4b9c30b48a8012c8"},"portrait": {"path": "sanko/pets/portraits/Joker.png","sha256": "fbf8dee7dd1073f184fbab17472f36899791b6dc7fe06e7b65bb5d67bed46494"}},
  "Ket": {"model": {"path": "sanko/buns/Ket.glb","sha256": "6f9f267fe6ddbb8695e2a60247eb624528399a74eeab054f96e03b41602c0208"},"portrait": {"path": "sanko/pets/portraits/Ket.png","sha256": "a56ffe1b1a2d66586961a68c906a82e8c92a25865371b664f1172f88f13a248b"}},
  "Kev": {"model": {"path": "sanko/buns/Kev.glb","sha256": "0c37c8cb0f3fdddec1a7092c8fd6a44703f00196791aa5a949fe37feb8fb827c"},"portrait": {"path": "sanko/pets/portraits/Kev.png","sha256": "6702e33633d128660617de8b487f8372d3c71c418bdab8c53f657299b6bf2425"}},
  "Lava": {"model": {"path": "sanko/buns/Lava.glb","sha256": "21cb9cb9f901c98abc4bc4c999fc5f693e215a214223b8ff1ddbdc31187e2dac"},"portrait": {"path": "sanko/pets/portraits/Lava.png","sha256": "d911d0b0adec7b91c62e1bb7b7a1c66d94c599577f6967be9ea51ec3ca0b2610"}},
  "Leathy": {"model": {"path": "sanko/buns/Leathy.glb","sha256": "5b2d5a42c20b1e195b9aef521465039ecfc052c6950e1d6afe445d5ebca2a070"},"portrait": {"path": "sanko/pets/portraits/Leathy.png","sha256": "bc06271221f950fa7b6f2889fcd6573464ae3ea7fa998f6212e12bfc0d539b23"}},
  "Lemuh": {"model": {"path": "sanko/buns/Lemuh.glb","sha256": "8d6a8bf7d90ae8470f83121f47ff96fe822d42bba417f4d54233b4b17fc9a185"},"portrait": {"path": "sanko/pets/portraits/Lemuh.png","sha256": "60268db18080357d24e24a548de73033b73fb12bfa1c18b011c045cc83868e69"}},
  "Lime": {"model": {"path": "sanko/buns/Lime.glb","sha256": "432217f05d00a0af2398e345acfcccfcde74ced9089de4130eb2fb4911946d75"},"portrait": {"path": "sanko/pets/portraits/Lime.png","sha256": "1fbb8d58fdb688f4ab752340be95c75f7fdddeec0e1da777e5b0c656d905d25c"}},
  "Mini": {"model": {"path": "sanko/buns/Mini.glb","sha256": "f1a5c2d63bb2cc64b99ca29f9994fb86fe3aa6318a6aca382f0399b5268d71a6"},"portrait": {"path": "sanko/pets/portraits/Mini.png","sha256": "4add2421a3fefc8c7d110cbe0e480311810f7daa1dc2e28413e85db321cd2ec9"}},
  "Nebula": {"model": {"path": "sanko/buns/Nebula.glb","sha256": "7186080d2bd0cb2a9928bcc5abaa59b6ff2a95d29ca446e0d50d588172feafa5"},"portrait": {"path": "sanko/pets/portraits/Nebula.png","sha256": "869ad743543eed1c799d5825780d4190be9cebae1836cc856fa614d210f543ff"}},
  "Orange": {"model": {"path": "sanko/buns/Orange.glb","sha256": "906ee17af9ecaac568f04972e8b0f9041b2e22d06a788255e47eca1e57832200"},"portrait": {"path": "sanko/pets/portraits/Orange.png","sha256": "9a4613364975569222f4523a1ea8e9976725623086c56b8174aefaf105fe37ad"}},
  "Peppermint": {"model": {"path": "sanko/buns/Peppermint.glb","sha256": "f25bdf450077822fc6aaa9c47fcbf0be3b36565667d76af695b4da51b4a9b3c6"},"portrait": {"path": "sanko/pets/portraits/Peppermint.png","sha256": "0a00db3fdfbfd4f54f77e8f6f7ccfcfa66807ed04e25634e769bd11f3f318aa4"}},
  "Pipe": {"model": {"path": "sanko/buns/Pipe.glb","sha256": "cc999346ad76ca57dec52bf32ab0762712acf378606c6c4590f4d09de8872f4c"},"portrait": {"path": "sanko/pets/portraits/Pipe.png","sha256": "47f4f35ca94d80f0857dc0c908ea3ac7742fe7b9dc4185bd3f1bfc6623e46dc5"}},
  "Pup": {"model": {"path": "sanko/buns/Pup.glb","sha256": "42e7358ef3df3410fc01a1043af499a7fe5e5ee4d44f55e43802118eb1640c02"},"portrait": {"path": "sanko/pets/portraits/Pup.png","sha256": "5048f5a3aa941366703ba5d30ee9994ea3e26dd02e870350ec1de57bfe5dde20"}},
  "Purple": {"model": {"path": "sanko/buns/Purple.glb","sha256": "b656f65115927cb2477e50dc118b21a752bfeef13677b2e0b6fa12cc625d79ba"},"portrait": {"path": "sanko/pets/portraits/Purple.png","sha256": "3870a1819e300f8a45ff8d5cde2b6e4d6fe9367dfb026be8db2ccb1ddb161f62"}},
  "Purr": {"model": {"path": "sanko/buns/Purr.glb","sha256": "b87b0cf2e3e4e533a1ac6c0c51655a452362c46f39a902957a946f8f81f13a25"},"portrait": {"path": "sanko/pets/portraits/Purr.png","sha256": "81e40e3e244179cbf28871a5ba16db38b2defadffc10a58af08d511f9eb11fd9"}},
  "RaceCar": {"model": {"path": "sanko/buns/RaceCar.glb","sha256": "4f82391aa44332450bd900c9f61bd107639082c7beedaf2a88e472b96e5a1232"},"portrait": {"path": "sanko/pets/portraits/RaceCar.png","sha256": "64e9cfb9a857792304d5dc21be33d3cd7aeb9fd57f21fc0b906b159c79d7e7ed"}},
  "Silver": {"model": {"path": "sanko/buns/Silver.glb","sha256": "7ee9fc6cdd8f9715ea66ee06b3b072a6bec695a55716c322bf9cd32231dbdca4"},"portrait": {"path": "sanko/pets/portraits/Silver.png","sha256": "ef79550d8ee6634c1519814258a92741394804f1cdf929c912032aeee876ef0d"}},
  "Snake": {"model": {"path": "sanko/buns/Snake.glb","sha256": "1d30e8873e184dfbe236ba82e648428272d5bc9d4b6fd709784c0e1b2c9d17ed"},"portrait": {"path": "sanko/pets/portraits/Snake.png","sha256": "331970c1e172449244c5c0784988e66eb667165469042548bc842c24a54c62a5"}},
  "Spirit": {"model": {"path": "sanko/buns/Spirit.glb","sha256": "1156062c1acd692b439da9d6735e2454025a2c8a040045a95feb4e7798bc8e54"},"portrait": {"path": "sanko/pets/portraits/Spirit.png","sha256": "52568e1e497f3cd86dc381aca546120c6fa92e536769aae14d64b08fe7d69e47"}},
  "Sproto": {"model": {"path": "sanko/buns/Sproto.glb","sha256": "a39f8fc7b31c49028450ab5f7a976295f412f900efb41a584143864a656d06c6"},"portrait": {"path": "sanko/pets/portraits/Sproto.png","sha256": "a0f18cd0d13e5f5afa7e13427e723db13cbeaddf9f0f47f22bf84d332cfdfb4d"}},
  "Strawbie": {"model": {"path": "sanko/buns/Strawbie.glb","sha256": "fad3c021ba58df1de49f4298849e2d9ea463bcf3b34abaa30cc750204c5ff6ba"},"portrait": {"path": "sanko/pets/portraits/Strawbie.png","sha256": "33079112a379f98bd9f7d5778512c60bdab244b91fd9b35b1b9642ce36e566b8"}},
  "SuperBun": {"model": {"path": "sanko/buns/SuperBun.glb","sha256": "45b4c4c2f666cf2942f2098cceaa68394efd74844660d50ea9465e1cbbab2ccb"},"portrait": {"path": "sanko/pets/portraits/SuperBun.png","sha256": "d37ca8bd6e8d0b379e4a207f90ad7dd1ca9a925031f3dab69b6882bea6425e34"}},
  "Tomat": {"model": {"path": "sanko/buns/Tomat.glb","sha256": "da7b8b1a6d4f831ad19ae71fe7ff0008dbf2a2c0189f0c157b57c66aa22131c0"},"portrait": {"path": "sanko/pets/portraits/Tomat.png","sha256": "02d062c7194eb4f44e5e51be57bde1e32cc131f937b5c566b58fd12e3007749b"}},
  "Turni": {"model": {"path": "sanko/buns/Turni.glb","sha256": "e61d96739c06a481564ba195c9e2b8dfbe48b3c47cd545933b008495861818e6"},"portrait": {"path": "sanko/pets/portraits/Turni.png","sha256": "245dc735769a8b7134afe38f4086c2817bfd4be08161ec3a4a64c6647883192e"}},
  "Turtly": {"model": {"path": "sanko/buns/Turtly.glb","sha256": "d9d19fa7769822d8443cf90b431ec5ea8d874ea6cc469987d719f8837745b0ad"},"portrait": {"path": "sanko/pets/portraits/Turtly.png","sha256": "f87523f4ddffa0053ff830e912f201d804ea99e0ad1d3f48218f730c4ae807a7"}},
  "Tux": {"model": {"path": "sanko/buns/Tux.glb","sha256": "e65638e52af8fe63ebab4cc6d8e1d545c00e06038e5fbdfc2dca60562ce205dd"},"portrait": {"path": "sanko/pets/portraits/Tux.png","sha256": "75391d66cff1d87e6ce8004f36d852ad3db8f8274aa12ede183b6db9a7988b5c"}},
  "Wood": {"model": {"path": "sanko/buns/Wood.glb","sha256": "f36dfacb18dffe411642db42093fc1b275fa2bfffb7d561015193b08ad420f5c"},"portrait": {"path": "sanko/pets/portraits/Wood.png","sha256": "405e78bda5d10963875b8bda0eb3a8be5ed0b92e7fe03ebb8b1f2b10bd88aff7"}},
  "Yeti": {"model": {"path": "sanko/buns/Yeti.glb","sha256": "8e1e03a33f9ad2aec0bd2266bbe1aa8e7ad2e566fbed0f967b7f4ae3678e4815"},"portrait": {"path": "sanko/pets/portraits/Yeti.png","sha256": "b16e24763b2d3af655e783da5eb7b3969e9033c2b2c85ef7105f23674f9f679c"}}
});

export const BUN_ANIMATIONS = freeze({
  "version": "bun-smooth-v1",
  "positionScaleOnLoad": 200,
  "run": {
    "path": "sanko/buns/anim/bun-run-smooth-v1.glb",
    "sha256": "bf27637b566d518294822962e6969a303f91cbefed758ceee4fa52a6dd601acd",
    "bytes": 15108,
    "duration": 0.6
  },
  "curious": {
    "path": "sanko/buns/anim/bun-curious-smooth-v1.glb",
    "sha256": "7ac3b8ec32cd69546241ac925109dde8bc9dbf40c8df42d73051cdc8e8e71b82",
    "bytes": 11632,
    "duration": 2.4,
    "loop": false,
    "returnsToIdle": true
  }
});

// Original face records captured from Sigma module266467, 12 November 2026.
export const BUN_FACES = freeze({
  "version": "sankopets-face-v1",
  "source": "Sanko-Dream-Machine/sanko-pets@0913a7b9c2f7f1c56e4fc13c3efb06dc8a78a753",
  "textures": {
    "eyesHappy": {
      "path": "sanko/pets/expressions/v1/eye-s-1.png",
      "sha256": "259f65e6a049c6e8ed55c9cae83076e8d6616dc34fe1d2f6867e32085b6d6396"
    },
    "eyesSad": {
      "path": "sanko/pets/expressions/v1/eye-s-2.png",
      "sha256": "6ada6c7521b9c83a6d1bbc3fc2b0ef394664884386fdf8334fa0eaa2cf44005b"
    },
    "mouthHappy": {
      "path": "sanko/pets/expressions/v1/mouth-1.png",
      "sha256": "11173c994f929fa24c5a3073d8fe41a44f11bcf3080f827615c2660972945413"
    },
    "mouthSad": {
      "path": "sanko/pets/expressions/v1/mouth-2.png",
      "sha256": "91dee320344dc8164c2dd41a745bf50194dec745b85b55471093e91c7728a78e"
    },
    "mouthAngry": {
      "path": "sanko/pets/expressions/v1/mouth-3.png",
      "sha256": "1f579bb26e92a17967782718ee3f86c364affa1883186ee9cea1acd730a81257"
    },
    "mouthLove": {
      "path": "sanko/pets/expressions/v1/mouth-4.png",
      "sha256": "28a89be8c739d267d73e7f2b1fabed0df6ac72aefb1c2576768b1600396b907a"
    }
  }
});
