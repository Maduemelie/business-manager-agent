from app.services.perfume_selector import PerfumeSelector

def test_perfume_selector_persistent_rotation(db_repo):
    selector = PerfumeSelector(db_repo)
    
    # 1. Pull 3 times
    ids = []
    for _ in range(3):
        p = selector.select_perfume("Oud & Luxury")
        assert p is not None
        ids.append(p.id)
        
    # Ensure all 3 were unique (persistent history working)
    assert len(set(ids)) == 3, "Selector must select distinct items before repeating"
    
    # 2. 4th pull should trigger reset and repeat one of the IDs
    p4 = selector.select_perfume("Oud & Luxury")
    assert p4 is not None
    assert p4.id in [1, 2, 3]
    
    # Ensure that database history size is now 1 (the reset worked and added the new choice)
    assert len(db_repo.get_recently_used_ids()) == 1
