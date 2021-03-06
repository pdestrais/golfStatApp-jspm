import { F7 } from '../../services/f7';
import {inject} from 'aurelia-framework';
import { Router } from 'aurelia-router';
import { Pouch } from '../../services/pouch';
import { SimpleCache } from '../../services/simpleCache';
import {NewInstance} from 'aurelia-dependency-injection';
import {ValidationRules,ValidationController} from 'aurelia-validation';
import {BootstrapFormRenderer} from '../../bootstrap-validation/bootstrap-form-renderer'
import {I18N,BaseI18N} from 'aurelia-i18n';
import {EventAggregator} from 'aurelia-event-aggregator';
//import {required, email, length, date, datetime, numericality, ValidationRules} from 'aurelia-validatejs';

@inject(F7, Router, Pouch, SimpleCache,NewInstance.of(ValidationController),I18N,Element,EventAggregator,BootstrapFormRenderer)
export class course extends BaseI18N {
    countries = ["Belgium","France","Spain","Germany","Luxembourg"];

    constructor(f7,router, pouch, simpleCache,controller,i18n,element,eventAggregator,bsRenderer) {
        console.log('Entering vin constructor');
        super(i18n,element,eventAggregator);
        this.f7 = f7;
        this.router = router;
        this.pouch = pouch;
        this.cache = simpleCache;
        this.controller = controller;
        this.isDirty = false;
        this.phase = 1;
        this.round = {};
        this.currHole = 1;
        this.currShot = 1;
    }
    
    activate(params) {
        console.log('Course activate called - params is :'+JSON.stringify(params));
        var _self = this;
        this.round.dateTime = new Date().toISOString();
        if (params.id) {
            this.pouch.getDoc(params.id).then(course => {
                _self.round.courseName = course.courseData.courseName;
                _self.round.courseId = course.course._id;
            });
            this.phase = 1;
        }
    }
 
    attached() {
        super.attached();
            this.i18n.updateTranslations(this.element);
        //Initialize swiper
        this.f7.swiper('.swiper-container', {
            speed: 400,
            spaceBetween: 100
        });
    }

    saveRoundPlayer() {
        this.phase = 2;
    }
   
    saveRound() {
      let _self = this;
      console.log("saving course");
      this.controller
      .validate()
      .then(errors => {
        if (errors.length === 0) {
            console.log("All is good while creating courses!");
            let _self1 = _self
            if (_self.isDirty) {
                _self.course.lastUpdated = new Date().toISOString();
                let docToSave = _self._id?{"_id":_self._id,"_rev":_self._rev,"courseData":_self.course,"type":"course"}:{"_id":_self.course.courseName+"-"+_self.course.country,"courseData":_self.course,"type":"course"};
                _self.pouch.saveDoc(docToSave)
                    .then(response => {
                        let _self2 = _self1
                        if (response.ok) { 
                            _self1.f7.alert('Course saved','GolfStatApp',function(){
                                console.log("Saved");
                                _self2.isDirty = false;
                                _self2.router.navigateToRoute('search');
                            });
                        } else {
                            _self1.f7.alert("Problem with creation or update",'GolfStatApp');
                        }
                    });
            }          
        }
        else {
            console.log("Validation errors");
            _self.f7.alert("Validation errors still exist",'GolfStatApp');
        }
      });
    }

    deleteCourse() {
        let _self = this;
        this.f7.confirm('Are you sure ?', 'GolfStatApp', function () {
            let result = _self.pouch.deleteDoc(_self.course).then(response => {
                if (response.ok)
                    _self.f7.alert('Course deleted', 'GolfStatApp', function () {
                        _self.isDirty = false;
                        _self.router.navigateToRoute('search');
                    });
                else
                    _self.f7.alert('problem with deletion', 'GolfStatApp');
                }
            ).catch(err => _self.f7.alert('problem with deletion', 'GolfStatApp'));
        });
    }
    
    cancel() {
        this.router.navigateBack();
    }

    adjustNbrHoles() {
        if (this.toggle18)
            this.course.nbrHoles = 18
        else {
            this.course.nbrHoles = 9;
            this.course.holes = this.course.holes.splice(9,9);
            this.currHole = 9
        }
    }
    
    goToPrevHole() {
        this.isDirty=true;
        if (this.currHole>1)
            this.currHole = this.currHole-1;
    }

    goToNextHole() {
        this.isDirty=true;
        if (this.course.holes[this.currHole]) {
            this.currHole++;
            return;
        }
        if (this.currHole<=this.course.nbrHoles-1) {
            this.currHole = this.currHole+1;
            this.course.holes[this.currHole-1]={"number": this.currHole,"par":4,"strokeIndex": 1,"lengthM": "0"};
        }
    }

    showDate(ISODateString) {
        return ISODateString.substring(0,10)
    } 
}

class CourseModel {
  constructor(courseName,country,par,SSS,slope,nbrHoles,holes) {
    this.courseName = courseName;
    this.country = country;
    this.par = par;
    this.SSS = SSS;
    this.slope = slope;
    this.holes = holes;
    this.nbrHoles = nbrHoles;
  }
}