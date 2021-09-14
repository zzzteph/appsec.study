@include('include.header')


	



	 <section class="section">
		 <div class="container">

		



			<form method="POST" action="{{route('admin-update-lab-lesson-questions',['id' => $lesson->lesson_id,'question_id' => $question->id])}}">
			@method('PUT')
			@csrf



<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="question">{{$question->question}}</textarea>
	
  </div>
</div> 

	

<div class="field">
  <label class="label">Answer</label>
  <div class="control">
		<input class="input" type="text" placeholder="Answer" name="answer" value="{{$question->answer}}">
  </div>
</div>


<div class="field">
  <label class="label">Score</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="{{$question->score}}">
  </div>
</div>





<div class="field">
  <div class="control">
    <button class="button is-success is-large">Update</button>
  </div>
</div>
</form>


    </div>

    </section>



@include('include.footer')