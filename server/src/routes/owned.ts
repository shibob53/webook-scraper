import { Router } from "express";
import { list, moveToOwned } from "../controllers/ownedController";

const router = Router()

router.post('/create', moveToOwned)
router.get('/list', list)

export default router