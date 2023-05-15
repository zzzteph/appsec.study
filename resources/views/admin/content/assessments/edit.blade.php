@include('include.header')


	 <section class="section">
		 <div class="container">

<form method="POST" action="{{route('admin-update-tournament',['id' => $topic->id])}}">
  @method('PUT')
  @csrf

	

<div class="field">
  <label class="label">Name</label>
  <div class="control">
		<input class="input" type="text" name="name" value="{{$topic->name}}">
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="description" name="description">{{$topic->description}}</textarea>
	
  </div>
</div>
<div class="field">
<div class="select">
  <select name="structure" disabled>
  @if($topic->structure=='linear')
		<option value='linear' selected>linear</option>
		<option value='graph'>graph</option>
	@else
	    <option value='linear' >linear</option>
		<option value='graph' selected>graph</option>
	@endif
  </select>
</div>
</div>

<div class="field">
 <label class="label">Start date</label>
  <div class="control">
	<input id="start_at" name="start_at" class="input" data-is-range="true" type="date" value="{{$topic->start_at}}">
  </div>
</div>



<div class="field">
 <label class="label">End date</label>
  <div class="control">
		
	<input id="ends_at" name="ends_at" class="input" data-is-range="true" type="date" value="{{$topic->ends_at}}">

  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
	

		@if ($topic->published)
			<input type="checkbox" name="published" checked>
		@else
			<input type="checkbox" name="published">
		@endif

     Published
    </label>
  </div>
</div>



<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>

		 <section class="section">
		 <div class="container">
<article class="message is-danger">
  <div class="message-header">
    <p>Danger!</p>

  </div>
  <div class="message-body">
			<form method="POST" action="{{route('admin-delete-tournament',['id' => $topic->id])}}">
			@csrf
			 @method('DELETE')
			<button class="button is-danger is-fullwidth">Delete topic</button>
			 </form>
  </div>
</article>

    </div>

    </section>


@include('include.footer')