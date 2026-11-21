// Original poster scenes. Difference circles use final 1280 × 800 image pixels.
// Notes describe the change from image A to image B; circles never overlap.
export const SCENES = [
  {
    "id": 1,
    "name": "Moonlit Canal",
    "palette": [
      "#1a1f3d",
      "#356c73",
      "#f4c46a",
      "#ece4bc"
    ],
    "imgA": "scenes/scene1a.png",
    "imgB": "scenes/scene1b.png",
    "diffs": [
      {
        "x": 1010,
        "y": 123,
        "r": 35,
        "type": "moved",
        "note": "The little cloud beside the moon drifts right."
      },
      {
        "x": 173,
        "y": 325,
        "r": 28,
        "type": "moved",
        "note": "A hanging lantern sits lower on its cord."
      },
      {
        "x": 448,
        "y": 278,
        "r": 25,
        "type": "removed",
        "note": "One attic window loses its light."
      },
      {
        "x": 1008,
        "y": 499,
        "r": 31,
        "type": "removed",
        "note": "The cat on the canal wall disappears."
      },
      {
        "x": 744,
        "y": 220,
        "r": 22,
        "type": "added",
        "note": "A tiny star appears above the bridge."
      },
      {
        "x": 1090,
        "y": 599,
        "r": 29,
        "type": "added",
        "note": "A terracotta planter appears on the quay."
      },
      {
        "x": 292,
        "y": 381,
        "r": 27,
        "type": "recolored",
        "note": "One pair of shutters changes from teal to rust."
      },
      {
        "x": 889,
        "y": 413,
        "r": 25,
        "type": "recolored",
        "note": "A bridge lantern changes from amber to rose."
      },
      {
        "x": 650,
        "y": 593,
        "r": 36,
        "type": "resized",
        "note": "The gondola cushion becomes wider."
      },
      {
        "x": 387,
        "y": 650,
        "r": 28,
        "type": "detail",
        "note": "The floating leaf points the other way."
      }
    ]
  },
  {
    "id": 2,
    "name": "Rooftop Garden",
    "palette": [
      "#f2a65e",
      "#c87568",
      "#376b5b",
      "#f1dfb5"
    ],
    "imgA": "scenes/scene2a.png",
    "imgB": "scenes/scene2b.png",
    "diffs": [
      {
        "x": 218,
        "y": 167,
        "r": 29,
        "type": "moved",
        "note": "A swallow moves a little to the right."
      },
      {
        "x": 1012,
        "y": 519,
        "r": 31,
        "type": "moved",
        "note": "The watering can slides along the terrace."
      },
      {
        "x": 417,
        "y": 424,
        "r": 28,
        "type": "removed",
        "note": "One cream towel vanishes from the laundry line."
      },
      {
        "x": 1123,
        "y": 619,
        "r": 28,
        "type": "removed",
        "note": "A small flowerpot disappears."
      },
      {
        "x": 746,
        "y": 151,
        "r": 23,
        "type": "added",
        "note": "A second distant swallow appears."
      },
      {
        "x": 312,
        "y": 634,
        "r": 28,
        "type": "added",
        "note": "A fallen orange appears on the paving."
      },
      {
        "x": 866,
        "y": 415,
        "r": 27,
        "type": "recolored",
        "note": "A cushion changes from coral to golden ochre."
      },
      {
        "x": 128,
        "y": 526,
        "r": 29,
        "type": "recolored",
        "note": "A planter changes from terracotta to blue-green."
      },
      {
        "x": 609,
        "y": 546,
        "r": 34,
        "type": "resized",
        "note": "The sleeping cat grows a little plumper."
      },
      {
        "x": 1077,
        "y": 326,
        "r": 29,
        "type": "detail",
        "note": "One skyline window has its shutter opened."
      }
    ]
  },
  {
    "id": 3,
    "name": "Desert Caravan",
    "palette": [
      "#d97b4a",
      "#923e45",
      "#e8c88f",
      "#382c46"
    ],
    "imgA": "scenes/scene3a.png",
    "imgB": "scenes/scene3b.png",
    "diffs": [
      {
        "x": 1060,
        "y": 156,
        "r": 30,
        "type": "moved",
        "note": "A bright evening star shifts to the right."
      },
      {
        "x": 283,
        "y": 639,
        "r": 31,
        "type": "moved",
        "note": "A water jar moves across the sand."
      },
      {
        "x": 181,
        "y": 473,
        "r": 28,
        "type": "removed",
        "note": "One oasis fruit cluster disappears."
      },
      {
        "x": 1158,
        "y": 627,
        "r": 27,
        "type": "removed",
        "note": "A little desert rock disappears."
      },
      {
        "x": 445,
        "y": 201,
        "r": 23,
        "type": "added",
        "note": "A new star appears over the dunes."
      },
      {
        "x": 532,
        "y": 637,
        "r": 29,
        "type": "added",
        "note": "A small striped travel bundle appears."
      },
      {
        "x": 850,
        "y": 507,
        "r": 27,
        "type": "recolored",
        "note": "A tent medallion changes from cream to teal."
      },
      {
        "x": 619,
        "y": 435,
        "r": 25,
        "type": "recolored",
        "note": "A caravan saddle blanket changes color."
      },
      {
        "x": 1015,
        "y": 649,
        "r": 33,
        "type": "resized",
        "note": "The campfire becomes slightly taller."
      },
      {
        "x": 751,
        "y": 650,
        "r": 27,
        "type": "detail",
        "note": "A sand scorpion turns to face the opposite way."
      }
    ]
  },
  {
    "id": 4,
    "name": "The Observatory",
    "palette": [
      "#101c33",
      "#3fae8c",
      "#b7c9cc",
      "#f4c46a"
    ],
    "imgA": "scenes/scene4a.png",
    "imgB": "scenes/scene4b.png",
    "diffs": [
      {
        "x": 1065,
        "y": 139,
        "r": 28,
        "type": "moved",
        "note": "One constellation star shifts to the right."
      },
      {
        "x": 276,
        "y": 640,
        "r": 31,
        "type": "moved",
        "note": "A small snow-covered stone moves right."
      },
      {
        "x": 159,
        "y": 356,
        "r": 27,
        "type": "removed",
        "note": "A distant shooting star disappears."
      },
      {
        "x": 1102,
        "y": 539,
        "r": 27,
        "type": "removed",
        "note": "A cabin window loses its warm light."
      },
      {
        "x": 422,
        "y": 171,
        "r": 22,
        "type": "added",
        "note": "A new bright star appears beside the aurora."
      },
      {
        "x": 914,
        "y": 638,
        "r": 30,
        "type": "added",
        "note": "A small trail marker appears in the snow."
      },
      {
        "x": 649,
        "y": 501,
        "r": 28,
        "type": "recolored",
        "note": "The observatory door changes from teal to rust."
      },
      {
        "x": 1155,
        "y": 398,
        "r": 25,
        "type": "recolored",
        "note": "A ridge beacon changes from amber to red."
      },
      {
        "x": 721,
        "y": 346,
        "r": 32,
        "type": "resized",
        "note": "The telescope eyepiece becomes longer."
      },
      {
        "x": 382,
        "y": 536,
        "r": 28,
        "type": "detail",
        "note": "A little weather vane points west instead of east."
      }
    ]
  },
  {
    "id": 5,
    "name": "Winter Market",
    "palette": [
      "#26324f",
      "#ac3e4a",
      "#eac478",
      "#e7e9df"
    ],
    "imgA": "scenes/scene5a.png",
    "imgB": "scenes/scene5b.png",
    "diffs": [
      {
        "x": 229,
        "y": 164,
        "r": 28,
        "type": "moved",
        "note": "A bright star moves a little to the right."
      },
      {
        "x": 1072,
        "y": 646,
        "r": 33,
        "type": "moved",
        "note": "The little sled slides across the snow."
      },
      {
        "x": 449,
        "y": 367,
        "r": 25,
        "type": "removed",
        "note": "One glowing string bulb disappears."
      },
      {
        "x": 150,
        "y": 601,
        "r": 27,
        "type": "removed",
        "note": "A wrapped parcel disappears."
      },
      {
        "x": 786,
        "y": 185,
        "r": 22,
        "type": "added",
        "note": "A new evening star appears."
      },
      {
        "x": 608,
        "y": 650,
        "r": 30,
        "type": "added",
        "note": "A little snow-covered fir pot appears."
      },
      {
        "x": 306,
        "y": 488,
        "r": 28,
        "type": "recolored",
        "note": "A wreath ribbon changes from red to gold."
      },
      {
        "x": 919,
        "y": 477,
        "r": 27,
        "type": "recolored",
        "note": "A market jar changes from amber to teal."
      },
      {
        "x": 1149,
        "y": 295,
        "r": 32,
        "type": "resized",
        "note": "The chimney smoke curl becomes larger."
      },
      {
        "x": 727,
        "y": 573,
        "r": 29,
        "type": "detail",
        "note": "The bakery sign changes its crescent detail."
      }
    ]
  }
];
