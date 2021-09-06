<?php

namespace App\Http\Controllers\Web;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Course;
use App\Models\Topic;
use App\Models\Lesson;
use App\Models\LabLesson;
use App\Models\LabLessonQuestion;
use App\Models\UserLesson;
use App\Models\UserLabLessonQuestion;
use Illuminate\Support\Facades\Storage;
class LabLessonQuestionController extends Controller
{
	
	
	public function list($course_id,$topic_id,$lesson_id)
    {
		$course = Course::findOrFail($course_id);
		$topic = Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		return view('admin.content.course.topic.lesson.lab.question.list',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson]);

	
    }
	
		public function new($course_id,$topic_id,$lesson_id)
    {
		$course = Course::findOrFail($course_id);
		$topic = Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		return view('admin.content.course.topic.lesson.lab.question.new',['course' =>$course,'topic' =>$topic,'lesson' =>$lesson]);

	
    }

	
	
	
	public function create(Request $request,$course_id,$topic_id,$lesson_id)
	{
		
		$validated = $request->validate([
			'question' => 'required',
			'answer' => 'required',
			'score' => 'required',
		]);
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		
		$question=new LabLessonQuestion; 
		$question->answer=$request->input('answer');
		$question->question=$request->input('question');
		$question->score=intval($request->input('score'));
		$question->type='string';
		
		$lesson->lab->questions()->save($question);

		return redirect()->route('list-lab-lesson-questions',['course_id' =>$course->id,'topic_id' =>$topic->id,'lesson_id' =>$lesson->id]);
	}
	
	
	
	

	public function edit($course_id,$topic_id,$lesson_id,$question_id)
    {
		return view('admin.content.course.topic.lesson.lab.question.edit',['course' =>Course::findOrFail($course_id),'topic' =>Topic::findOrFail($topic_id),'lesson' =>Lesson::findOrFail($lesson_id),'question' =>LabLessonQuestion::findOrFail($question_id)]);
    }

	public function decrease($course_id,$topic_id,$lesson_id,$question_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		$question=LabLessonQuestion::findOrFail($question_id);
		if($question->order>0)
		$question->order=$question->order-1;
		
		$question->save();
		return redirect()->route('list-lab-lesson-questions', ['course_id' =>$course->id,'topic_id' =>$topic->id,'lesson_id' =>$lesson->id]);
	}

	
	public function increase($course_id,$topic_id,$lesson_id,$question_id)
	{
		$course=Course::findOrFail($course_id);
		$topic=Topic::findOrFail($topic_id);
		$lesson=Lesson::findOrFail($lesson_id);
		$question=LabLessonQuestion::findOrFail($question_id);
		$question->order=$question->order+1;
		
		$question->save();
		return redirect()->route('list-lab-lesson-questions', ['course_id' =>$course->id,'topic_id' =>$topic->id,'lesson_id' =>$lesson->id]);
	}

	
	
	public function delete(Request $request,$course_id,$topic_id,$lesson_id,$question_id)
	{	

		 LabLessonQuestion::where('id', $question_id)->delete();
		return redirect()->route('list-lab-lesson-questions', ['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);
	}


	public function update(Request $request,$course_id,$topic_id,$lesson_id,$question_id)
	{
		$question=LabLessonQuestion::findOrFail($question_id);
		$validated = $request->validate([
			'question' => 'required',
			'answer' => 'required',
			'score' => 'required',
		]);

		$question->answer=$request->input('answer');
		$question->question=$request->input('question');
		$question->score=intval($request->input('score'));
		$question->type='string';
		
		$question->save();

		return redirect()->route('list-lab-lesson-questions',['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);

	}
	

	public function answer(Request $request,$course_id,$topic_id,$lesson_id)
	{
		$validated = $request->validate([
			'question_id' => 'required',
			'answer' => 'required'
		]);
		//check if user can answer the question?
		if(Auth::user()->admin)
		{
			$course=Course::findOrFail($course_id);
			$topic = Topic::findOrFail($topic_id);
			$lesson = Lesson::findOrFail($lesson_id);
		}
		else
		{
			$course=Course::where('published', true)->findOrFail($course_id);
			$topic = Topic::where('published', true)->findOrFail($topic_id);
			$lesson = Lesson::where('published', true)->findOrFail($lesson_id);
			if(!$lesson->is_opened)
			{
				  return back()->withErrors(['message' => 'You have no access to that lesson']);
			}
			

		}

		


		$question=LabLessonQuestion::findOrFail($request->input('question_id'));


		if($question->correct==TRUE)
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);
		if($lesson->type!="lab")
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);
		if($lesson->id!=$question->lab_lesson->lesson->id)
			return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);
		
		foreach($lesson->lab->questions as $lab_question)
		{
			if(($question->id!=$lab_question->id) && $lab_question->correct!==TRUE)
			{
				
				return redirect()->route('view-lesson',['course_id' =>$course_id,'topic_id' =>$topic_id,'lesson_id' =>$lesson_id]);
			}
			if(($question->id==$lab_question->id) && $lab_question->correct!==TRUE)
			{
				break;
			}
		}
		

		similar_text($question->answer,$request->input('answer'),$similar_answers);
		$userLabLessonQuestion= new UserLabLessonQuestion;
		$userLabLessonQuestion->correct=FALSE;
		$userLabLessonQuestion->lab_lesson_question_id=$question->id;
		$userLabLessonQuestion->user_id=Auth::user()->id;
		$userLabLessonQuestion->answer=$request->input('answer');
		if($similar_answers>80)
		{
			$userLabLessonQuestion->correct=TRUE;
		}
		
		
		
		$userLabLessonQuestion->save();
		//update lesson status
		$userLesson=UserLesson::where('user_id',Auth::user()->id)->where('lesson_id',$lesson_id)->first();
		if($userLesson===null)
		{
			$userLesson=new UserLesson;
			$userLesson->lesson_id=$lesson_id;
			$userLesson->user_id=Auth::user()->id;
			
		}
		//check if 
		$userLesson->status='todo';
		
		$all_correct=true;
		foreach($lesson->lab->questions as $lab_question)
		{
			if($lab_question->correct!==TRUE)
			{	
				$all_correct=false;
				break;
			}
		}	
		if($all_correct)$userLesson->status='done';
		$userLesson->save();
		if(!$userLabLessonQuestion->correct)
			return redirect()->back()->withErrors('Your answer is wrong');
		return redirect()->back()->with('success', 'You are right!');   

	}

}
	
	
	
	
	
	

