# apasser

발음: '앞에서' => 외국인은 '아패서' 라고 읽었으면.. ㅋㅋ '패'에 엑센트~

많은 사용자의 등수를 성적을 기준으로 실시간 처리할 수 있는 엔진

Modified B+-Tree을 이용하여, 성적을 기준으로 수정시 실시간으로 개별 사용자의 등수를 관리할 수 있도록 한다. 등수 기준은 1차적으로 성적의 오름차순/내림차순을 기준으로 하고, 이차적으로 사용자 UniqueID(숫자 53bit), 또는 가입순 또는 최신 업데이트 순의 오름차순/내림차순으로 정할 수 있도록 한다.

현재 테스트 결과로는 1,000,000사용자의 관리시 약 2,500tps정도 지원가능하며, Node.js를 이용하여 개발하였다. (SSD에서 테스트 결과 10M사용자시 1,500tps정도)

* [TODO] (#TODO)
* [INSTALL] (#INSTALL)
* [API] (#API)
* [CHANGES] (#CHANGES)

## TODO

* Locking 업그레이드 - (최소한의 Locking 또는 MVCC)
* 현재 profiling 결과로 array copy가 빈번하여, circular list를 이용한 array copy를 줄이는 방법 모색
* Bulk Load
* Backup/Restore 추가 (자체 파일의 Backup/Restore기능, Transaction Log를 이용한 복구)
* Unused Node를 관리하여 Disk 증가량 조절
* GUI data review console
* 최종 목표: 1억 사용자가 1일 100게임을 해도 버틸 수 있는 구조

## INSTALL

* please check wiki page.

## API - please check demo pages.

* Get User Score 

  http://127.0.0.1:17265/v1/user/sample/{usn}

* Update User Score 

  POST http://127.0.0.1:17265/v1/user/sample/{usn}

need score={score} on request body

* Delete User 

  DELETE http://127.0.0.1:17265/v1/user/sample/{usn}

* Users around specfic users 

  http://127.0.0.1/v1/around/sample/{usn}?prior={number}&after={number}

* Users between two ranks (exclude last one) 

  http://127.0.0.1/v1/rankes/sample?s={startRank}&e={endRank}

* Get how many rankers between rank1 and rank2 

  http://127.0.0.1/v1/nrankers/sample?s={startRank}&e={endRank}

* get rank of score 

  http://127.0.0.1/v1/rank\_of/sample/{score}

* get Users which there score was below then 

  http://127.0.0.1/v1/usersFrom/sample/{score}?limit={#_of_user}


## CHANGES

0.2.0 
Array시 Disk 저장을 위하여 너무 많은 operation이 필요하여 구조를 최대한 Buffer에 byte를 이용하도록 수정

0.1.0 
Array를 이용한 수정된 B+-Tree를 이용한 최초 버젼


