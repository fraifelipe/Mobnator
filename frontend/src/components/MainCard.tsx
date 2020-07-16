import React, { useState, useRef, useContext, useEffect } from 'react'
import Button from '@material-ui/core/Button'
import { Card, CardContent, Typography, CardActions, makeStyles, Grid, TextField, Tooltip } from '@material-ui/core'
import Timer, { TimeRef } from './Timer'
import DndPeople from './DndPeople'
import { StateContext } from '../services/StateStore'
import DeleteForeverIcon from '@material-ui/icons/DeleteForever'
import GroupIcon from '@material-ui/icons/Group'
import axios from 'axios'

export interface Item {
  id: number;
  text: string;
}

const MainCard: React.FC = () => {
  const { state, dispatch } = useContext(StateContext)
  const [started, setStarted] = useState(false)
  const [shared, setShared] = useState(false)
  const [textField, setTextField] = useState('')

  const timerRef = useRef<TimeRef>(null)
  const classes = useStyles()

  useEffect(() => {
    const pathname = window.location.pathname
    console.log(pathname)
    if (pathname === '/') {
      dispatch({ type: 'SYNC', payload: null })
    } else {
      setShared(true)
      axios.get('http://localhost:5002/api/state', { params: { token: pathname.substr(1) } }).then((res) => {
        console.log(res)
        dispatch({ type: 'SYNC', payload: JSON.parse(res.data).state })
      })
    }
  }, [dispatch, setStarted])

  const addPerson = () => {
    dispatch({ type: 'ADD_PERSON', payload: textField })
  }

  const startMob = () => {
    setStarted(!started)
    if (state.firstStarted) {
      timerRef?.current?.continueTimer()
    } else {
      timerRef?.current?.startTimer(state.config)
    }
    dispatch({ type: 'SET_FIRST_STARTED', payload: true })
  }

  const stopMob = () => {
    setStarted(!started)
    timerRef?.current?.stopTimer()
  }

  const onFinish = () => {
    dispatch({ type: 'ROLL_PEOPLE', payload: null })
    timerRef?.current?.startTimer(state.config)

    if (state.config.pastRounds > state.config.roundCount) {
      timerRef?.current?.startTimer(state.config)
    }
  }

  const deleteButton = () => {
    if (state.firstStarted) {
      return (
        <Tooltip title="Reset Configurations" aria-label="Reset Configurations">
          <Button onClick={handleResetConfigs} disabled={started}>
            {<DeleteForeverIcon className={classes.groupIcon} />}
          </Button>
        </Tooltip>)
    }
  }

  const button = () => {
    return (started
      ? <Button className={classes.redButton} variant="contained" onClick={stopMob} >
        Stop Mob
      </Button >
      : <Button className={classes.startButton} variant="contained" color="primary" onClick={startMob}>
        Start Mob
      </Button>)
  }

  const timeText = () => {
    if (state.config?.break) {
      return <div> Break Time! </div>
    }
    if (started) {
      return <div> Running </div>
    } else {
      return <div> Paused </div>
    }
  }

  const handleResetConfigs = () => {
    dispatch({ type: 'RESET_CONFIG', payload: null })
    timerRef?.current?.resetTime()
  }

  const handleShare = () => {
    dispatch({ type: 'SHARE', payload: null })
  }

  return (
    <Card className={classes.root}>
      <CardContent className={classes.content}>
        <Typography className={classes.title} color="textSecondary" gutterBottom>
          Mobnator
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <div className={classes.addPersonWrapper}>
              <TextField
                size="small"
                variant="outlined"
                label="Enter the name here"
                className={classes.textField}
                disabled={started}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextField(e.target?.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPerson()}
              ></TextField>

              <Button className={classes.addButton} variant="contained" color="secondary" onClick={addPerson}
                disabled={started}>
                Add Participant
              </Button>
            </div>
            <div className={classes.parameters}>
              <Grid className={classes.parametersGrid} item xs={12}>
                <span className={classes.parametersLabel}>Round duration in minutes:</span>
                <TextField
                  className={classes.parametersItems}
                  size="small"
                  variant="outlined"
                  value={state.config?.roundMinutes}
                  type="number"
                  disabled={started}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_CONFIG_ROUND_MINUTES', payload: e.target?.value })}
                ></TextField>
              </Grid>
              <Grid className={classes.parametersGrid} item xs={12}>
                <span className={classes.parametersLabel}>Interval duration in minutes:</span>
                <TextField
                  className={classes.parametersItems}
                  size="small"
                  variant="outlined"
                  value={state.config?.breakMinutes}
                  type="number"
                  disabled={started}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_CONFIG_BREAK_MINUTES', payload: e.target?.value })}
                ></TextField>
              </Grid>
              <Grid className={classes.parametersGrid} item xs={12}>
                <span className={classes.parametersLabel}>Start interval after (number of rounds):</span>
                <TextField
                  className={classes.parametersItems}
                  size="small"
                  variant="outlined"
                  value={state.config?.roundCount}
                  type="number"
                  disabled={started}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'SET_CONFIG_ROUND_COUNT', payload: e.target?.value })}
                ></TextField>
              </Grid>
              <Grid className={classes.parametersGrid + ' ' + classes.timer} item xs={12}>
                <Timer ref={timerRef} onFinish={onFinish}></Timer>
              </Grid>
              <Grid className={classes.timerText} item xs={12}>
                {/* <CasinoOutlinedIcon className={classes.diceIcon}></CasinoOutlinedIcon> */}
                {timeText()}
              </Grid>
            </div>
          </Grid>
          <Grid item xs={6}>
            <DndPeople />
          </Grid>
        </Grid>
      </CardContent >
      <CardActions>
        <Grid item xs={1}>
          {
            shared
              ? ''
              : <Tooltip title="Reset Configurations" aria-label="Reset Configurations">
                <Button disabled={false} onClick={handleShare} >
                  <GroupIcon className={classes.groupIcon}></GroupIcon>
                </Button>
              </Tooltip>
          }
        </Grid>
        <Grid item xs={10}>
          {button()}
        </Grid>
        <Grid item xs={1}>
          {deleteButton()}
        </Grid>
      </CardActions>
    </Card >
  )
}

const useStyles = makeStyles({
  root: {
    minWidth: 875,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: '0px auto 50px',
    maxWidth: '600px',
    width: '90%',
    textAlign: 'center'
  },
  content: {
    minHeight: 500
  },
  addPersonWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    maxHeight: '37.5px',
    width: '100%',
    alignItems: 'left',
    justifyContent: 'left',
    paddingBottom: '50px'
  },
  parameters: {
    display: 'flex',
    flexWrap: 'wrap',
    maxHeight: '37.5px',
    width: '100%',
    alignItems: 'right',
    justifyContent: 'right',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'rgb(88, 88, 88)',
    paddingBottom: '10px'
  },
  parametersGrid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '65px',
    maxHeight: '37.5px',
    marginBottom: '20px'
  },
  parametersLabel: {
    flex: 1,
    paddingBottom: '15px',
    textAlign: 'left'
  },
  parametersItems: {
    display: 'flex',
    width: '65px',
    maxHeight: '37.5px',
    paddingBottom: '10px',
    paddingLeft: '10px'
  },
  textField: {
    flex: 1
  },
  addButton: {
    marginLeft: '5px',
    height: '39px',
    color: 'white',
    fontSize: '15px'
  },
  title: {
    fontSize: 35,
    color: 'black'
  },
  pos: {
    marginBottom: 12
  },
  container: {},
  startButton: {
    marginBottom: '10px',
    alignSelf: 'center',
    margin: '0 auto'
  },
  redButton: {
    marginBottom: '10px',
    alignSelf: 'center',
    margin: '0 auto',
    backgroundColor: 'red'
  },
  diceIcon: {
    transform: 'rotate(30deg)',
    fontSize: '50px'
  },
  groupIcon: {
    fontSize: '30px'
  },
  timer: {
    paddingTop: '70px'
  },
  timerText: {
    paddingTop: '30px'
  }
})

export default MainCard
